<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

import { useImageStore } from '@/stores/image'

const imageStore = useImageStore()
const streetViewMode = ref(false)
const mode = ref('point')
const isLoading = ref(false)
var map
var viewer
var images
var tours
var groupedByTourId
var bPositionY = -200

const loadmap = async () => {
  try {
    map = new sphere.Map({
      placeholder: document.getElementById('map')
    })
    await map.goTo({ center: { lon: 100.578696, lat: 13.845183 }, zoom: 18 });

    document.getElementById('container').addEventListener('mouseup', async function (e) {

      var current_scene = Number(viewer.getScene())

      setTimeout(async () => {
        var new_scene = Number(viewer.getScene())
        // กด hotspot เปลี่ยน scene ใหม่
        map.Overlays.clear();
        await pointmaker()
        if (current_scene != new_scene) {
          for (let i = 0; i < tours.length; i++) {
            if (tours[i].id == new_scene) {

              if (new_scene > current_scene) {
                console.log('go', new_scene, '>', current_scene)
                bPositionYChange(tours[i].north_offset)
              }

              // ถอยหลัง, สวนทาง ให้หมุนไปตรงข้าม
              else if (new_scene < current_scene) {
                console.log('back', tours[i].north_offset, tours[i].north_offset + 180, new_scene, '<', current_scene)
                bPositionYChange(tours[i].north_offset + 180)
              }
              await personmaker(tours[i].lon, tours[i].lat)
            }
          }
        } else if (current_scene == new_scene) {
          for (let i = 0; i < tours.length; i++) {
            if (tours[i].id == current_scene) {
              console.log(viewer.getYaw())
              var angle = await viewer.getYaw() + tours[i].north_offset
              if (angle < 0) {
                angle = await angle + 360
              }
              console.log(angle)
              bPositionYChange(angle)
              await personmaker(tours[i].lon, tours[i].lat)
            }
          }
        }
      }, 500)

    });
    map.Event.bind(sphere.EventName.OverlayClick, async function (e) {
      map.Overlays.clear();
      document.getElementById('toast').style.display = "none"
      if (viewer) {
        await viewer.destroy()
        console.log('destroy')
      }
      await pointmaker()
      document.getElementById("map").style.width = "50%"
      document.getElementById("container").style.display = "flex"
      document.getElementById("panorama").style.display = "flex"
      await loadPano(e._geojson.geometry.coordinates[1], e._geojson.geometry.coordinates[0]);
    });
  } catch (error) {
    console.log(error)
    setTimeout(() => {
      loadmap()
    }, 5000)
  }
}

const loadPano = async (lat, lon) => {
  try {

    if (mode.value !== 'tour') {
      await map.goTo({ center: { lon: 100.929076, lat: 13.103024 }, zoom: 18 });
      var image_source
      var image_name
      var north_offset
      for (let i = 0; i < images.length; i++) {
        if (lat === images[i].lat && lon === images[i].lon) {
          image_source = await images[i].image
          image_name = await images[i].name
          north_offset = await images[i].north_offset
        }
      }
      viewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": `${image_source}`,
        "autoLoad": true,
        "compass": true,
        "showControls": false,
        "previewTitle": `${image_name}`,
        "previewAuthor": 'earngqqw',
        "northOffset": north_offset,
        "hotSpotDebug": true,
      });

      var point

      point = new sphere.Marker({ lon: lon, lat: lat },
        {
          title: 'test',
          icon: {
            html: '<img src="/marker.png" style="width: 3rem">',
            offset: { x: 0, y: -30 }
          }
        });
      await map.Overlays.add(point);
      await viewer.loadScene();
    }

    // tour mode
    else {
      // สร้างเส้นสำหรับวัดระยะห่างจุดที่คลิกกับจุดข้อมูลเพื่อหาจุดข้อมูลที่ใกล้ที่สุด
      var min_length = 90000000
      var index
      for (let i = 0; i < tours.length; i++) {
        var polyline = await new sphere.Polyline([
          { lon: lon, lat: lat },
          { lon: Number(tours[i].lon), lat: Number(tours[i].lat) },
        ])

        const length = parseFloat(polyline.size('th').split(' ')[0] / 1000)
        if (length < min_length) {
          min_length = length
          index = i
        }
      }

      await map.goTo({ center: { lon: Number(tours[index].lon) + 0.001, lat: tours[index].lat }, zoom: 18 });

      var scene = await create_pano_json(index)
      viewer = pannellum.viewer('panorama', scene);
      await personmaker(lon, lat)
      bPositionYChange(tours[index].north_offset)
      await personmaker(tours[index].lon, tours[index].lat)
    }

    // Make buttons work
    document.getElementById('pan-up').addEventListener('click', function (e) {
      viewer.setPitch(viewer.getPitch() + 10);
      console.log('panup')
    });
    document.getElementById('pan-down').addEventListener('click', function (e) {
      viewer.setPitch(viewer.getPitch() - 10);
    });
    document.getElementById('pan-left').addEventListener('click', function (e) {
      viewer.setYaw(viewer.getYaw() - 10);
    });
    document.getElementById('pan-right').addEventListener('click', function (e) {
      viewer.setYaw(viewer.getYaw() + 10);
    });
    document.getElementById('zoom-in').addEventListener('click', function (e) {
      viewer.setHfov(viewer.getHfov() - 10);
    });
    document.getElementById('zoom-out').addEventListener('click', function (e) {
      viewer.setHfov(viewer.getHfov() + 10);
    });
    document.getElementById('fullscreen').addEventListener('click', function (e) {
      viewer.toggleFullscreen();
    });
    document.getElementById('look-north').addEventListener('click', async function (e) {
      console.log(viewer.getYaw())
      await viewer.setYaw(- viewer.getNorthOffset());
      console.log(viewer.getYaw())
    });
    document.getElementById('close-panorama').addEventListener('click', async function (e) {
      await viewer.destroy()
      document.getElementById('map').style.width = "100%"
      document.getElementById("container").style.display = "none"
      await map.goTo({ center: { lon: lon, lat: lat }, zoom: 18 })
    });
  } catch (error) {
    console.log(error)
  }
}

const loadImage = async () => {

  mode.value = 'point'
  await map.goTo({ center: { lon: 100.928076, lat: 13.103024 }, zoom: 18 });

  mapToggle()

  await map.goTo({ center: { lon: 100.928076, lat: 13.103024 }, zoom: 18 });

}

const loadTour = async () => {

  mode.value = 'tour'
  await map.goTo({ center: { lon: 100.578696, lat: 13.845183 }, zoom: 18 })

  mapToggle()

  await map.goTo({ center: { lon: 100.578696, lat: 13.845183 }, zoom: 18 })

}

const pointmaker = async () => {
  if (mode.value === 'tour') {
    var tours_length = tours.length
    for (let i = 0; i < tours_length; i++) {
      var marker
      marker = await new sphere.Marker({ lon: tours[i].lon, lat: tours[i].lat },
        {
          title: `${tours[i].name}`,
          icon: {
            html: '<img src="/point.png" style="width: 1rem; opacity: 0;">'
          }
        });
      await map.Overlays.add(marker);
    }

    //create line layer
    for (let i = 0; i < groupedByTourId.length; i++) {
      var line_coor = []
      var length = groupedByTourId[i].length
      for (let j = 0; j < length; j++) {
        var coor = { lon: groupedByTourId[i][j].lon, lat: groupedByTourId[i][j].lat }
        line_coor.push(coor)
      }

      var line = await new sphere.Polyline(line_coor, {
        lineWidth: 8,
        lineColor: 'rgba(0, 150, 200, 0.5)',
        pointer: true,
      })
      await map.Overlays.add(line)
    }
  }
  //point
  else {
    for (let i = 0; i < images.length; i++) {
      var marker
      marker = new sphere.Marker({ lon: images[i].lon, lat: images[i].lat },
        {
          title: `${images[i].name}`,
          icon: {
            html: '<img src="/point.png" style="width: 1rem;">'
          }
        });
      await map.Overlays.add(marker);
    }
  }
}

const personmaker = async (lon, lat) => {
  var marker2
  marker2 = new sphere.Marker({ lon: lon, lat: lat },
    {
      title: 'point',
      icon: {
        html: `<div style="background-image: url(&quot;//api.longdo.com/pano/server/images/navi_360.png&quot;); 
                    width: 50px; height: 50px; 
                    background-size: 50px 1600px; 
                    background-position-y:${bPositionY}px"></div>`,
        offset: { x: 0, y: -10 }
      },
      draggable: true
    });

  await map.Overlays.add(marker2);
}

const bPositionYChange = async (north_offset) => {
  if (north_offset > 360) {
    north_offset = await north_offset - 360
  }
  if (north_offset == 0) {
    bPositionY = 800
  } else if (north_offset > 0 && north_offset <= 22.5) {
    bPositionY = 900
  } else if (north_offset > 22.5 && north_offset <= 45) {
    bPositionY = 1000
  } else if (north_offset > 45 && north_offset <= 67.5) {
    bPositionY = 1100
  } else if (north_offset > 67.5 && north_offset <= 90) {
    bPositionY = 1200
  } else if (north_offset > 90 && north_offset <= 112.5) {
    bPositionY = 1300
  } else if (north_offset > 112.5 && north_offset <= 135) {
    bPositionY = 1400
  } else if (north_offset > 135 && north_offset <= 157.5) {
    bPositionY = 1500
  } else if (north_offset > 157.5 && north_offset <= 180) {
    bPositionY = 1600
  } else if (north_offset > 180 && north_offset <= 202.5) {
    bPositionY = 100
  } else if (north_offset > 202.5 && north_offset <= 225) {
    bPositionY = 200
  } else if (north_offset > 225 && north_offset <= 247.5) {
    bPositionY = 300
  } else if (north_offset > 247.5 && north_offset <= 270) {
    bPositionY = 400
  } else if (north_offset > 270 && north_offset <= 292.5) {
    bPositionY = 500
  } else if (north_offset > 292.5 && north_offset <= 315) {
    bPositionY = 600
  } else if (north_offset > 315 && north_offset <= 337.5) {
    bPositionY = 700
  } else if (north_offset > 337.5 && north_offset <= 360) {
    bPositionY = 800
  }
}

const mapToggle = () => {
  if (streetViewMode.value === false) {
    document.getElementById('toast').style.display = "flex"
  }
  else {
    document.getElementById('toast').style.display = "none"
  }

  streetViewMode.value = !streetViewMode.value

  if (streetViewMode.value === true) {
    pointmaker()

  } else {
    map.Overlays.clear()
    document.getElementById("map").style.width = "100%"
    document.getElementById("container").style.display = "none"

    var map_location = map.location()
    console.log(map_location)
  }
}

const create_pano_json = (index) => {
  var scene = `{"default": {"firstScene": "${tours[index].id}",\
\"sceneFadeDuration\": 1000,\
\"autoLoad\": true,\
\"author\": \"earngqqw\",\
\"compass\": true,\
\"preview\": \"preview\",\
\"previewTitle\": \"${tours[index].name}\",\
\"showControls\": false,\
\"northOffset\": ${tours[index].north_offset}\
},\"scenes\": {`
  for (let i = 0; i < groupedByTourId.length; i++) {
    var length = groupedByTourId[i].length
    for (let j = 0; j < length; j++) {
      scene += `\"${groupedByTourId[i][j].id}\": { \
\"title\": \"${groupedByTourId[i][j].name}\", \
\"yaw\": ${groupedByTourId[i][j].yaw}, \
\"type\": \"equirectangular\", \
\"panorama\": \"${JSON.stringify(groupedByTourId[i][j].image)}", \
\"northOffset\": ${groupedByTourId[i][j].north_offset}, \
\"hotSpots\": [`

      if (groupedByTourId[i][j].position == 'start') {
        scene += `{\
\"yaw\": ${groupedByTourId[i][j + 1].yaw},\
\"type\": \"scene\",\
\"text\": \"${groupedByTourId[i][j + 1].name}\",\
\"sceneId\": \"${groupedByTourId[i][j + 1].id}\",\
\"targetYaw\": 0\
}`
      } else if (groupedByTourId[i][j].position == 'between') {
        scene += `{\
\"yaw\": ${groupedByTourId[i][j + 1].yaw},\
\"type\": \"scene\",\
\"text\": \"${groupedByTourId[i][j + 1].name}\",\
\"sceneId\": \"${groupedByTourId[i][j + 1].id}\" ,\
\"targetYaw\": 0\
}, {\
\"yaw\": 180,\
\"type\": \"scene\",\
\"text\": \"${groupedByTourId[i][j - 1].name}\",\
\"sceneId\": \"${groupedByTourId[i][j - 1].id}\",\
\"targetYaw\": 180}`
      } else if (groupedByTourId[i][j].position == 'end') {
        scene += `{\
\"yaw\": ${180 - groupedByTourId[i][j - 1].yaw},\
\"type\": \"scene\",\
\"text\": \"${groupedByTourId[i][j - 1].name}\",\
\"sceneId\": \"${groupedByTourId[i][j - 1].id}\",\
\"targetYaw\": 180\
}`
      }

      if (i != groupedByTourId.length - 1) {
        scene += ']},'
      } else {
        if (j != length - 1) {
          scene += ']},'
        }

        else {
          scene += ']}'
        }
      }
    }
  }
  scene += '}}'

  var json = JSON.parse(scene)
  return json
}

onMounted(async () => {
  isLoading.value = true
  loadmap()
  images = await imageStore.loadImage()
  tours = await imageStore.loadTour()
  groupedByTourId = await imageStore.groupedByTourId
  console.log(tours.length)
  isLoading.value = false
})
</script>

<template>
  <!-- map -->
  <span v-if="isLoading" class="loader"></span>
  <div id="map">
    <button class="person" @click="loadImage"><img src="/person.png"></button>
    <div class="hidepoint">Start streetview!</div>
    <div id="toast"><img src="/point.png">select a point where you want to see streetview</div>
    <button class="tour" @click="loadTour"><img src="/person.png"></button>
    <div class="hidetour">Start tour!</div>
  </div>
  <!-- panorama -->
  <div id="container">
    <div id="panorama" @click=""></div>
    <div class="close" id="close-panorama">
      <div class="ctrl">X</div>
    </div>
    <div id="controls-container">
      <div id="controls">
        <div class="ctrl" id="pan-up">&#9650;
          <div class="hide">pan up</div>
        </div>
        <div class="ctrl" id="pan-down">&#9660;
          <div class="hide">pan down</div>
        </div>
        <div class="ctrl" id="pan-left">&#9664;
          <div class="hide">pan left</div>
        </div>
        <div class="ctrl" id="pan-right">&#9654;
          <div class="hide">pan right</div>
        </div>
        <div class="ctrl" id="zoom-in">&plus;
          <div class="hide">zoom in</div>
        </div>
        <div class="ctrl" id="zoom-out">&minus;
          <div class="hide">zoom out</div>
        </div>
        <div class="ctrl" id="look-north">N
          <div class="hide">set north</div>
        </div>
        <div class="ctrl" id="fullscreen">&#x2922;
          <div class="hide">fullscreen</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: 'Kanit';
  font-size: 12px;
}

#map {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.loader {
  width: 48px;
  height: 48px;
  border: 2px solid #bbdfee;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 30;
  display: flex;
}

.loader::after,
.loader::before {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 0;
  background: #2e4683;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.loader::before {
  left: auto;
  top: auto;
  right: 0;
  bottom: 0;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

img {
  width: 36px;
  padding-top: 4px;
}

#toast {
  position: absolute;
  top: 0;
  left: 4rem;
  margin: 1rem;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  color: rgb(72, 113, 130);
  /* text-align: center; */
  /* justify-content: center; */
  display: none;
  width: 360px;
  background-color: rgb(255, 247, 216);
  border: rgb(72, 113, 130) solid 3px;
  z-index: 20;
}

#toast>img {
  width: 12px;
  height: 12px;
  padding-right: 6px;
  justify-content: center;
}

#panorama {
  width: 100%;
  height: 100%;
}

#container {
  position: absolute;
  width: 50%;
  height: 100%;
  left: 50%;
  display: none;
  margin: 0;
  padding: 0;
  top: 0;
}

#controls-container {
  bottom: 4rem;
  position: absolute;
  width: 100%;
  z-index: 40;
  height: 33px;
  justify-content: center;
  display: flex;
}

#controls {
  position: absolute;
  text-align: center;
  padding-bottom: 3px;
  margin: auto;
}

.ctrl {
  padding: 8px 5px;
  width: 30px;
  height: 20px;
  text-align: center;
  background: rgb(255, 247, 216);
  display: inline-block;
  cursor: pointer;
}

.ctrl:hover {
  background: rgb(255, 236, 170);
}

.ctrl:hover .hide {
  display: block;
}

.hide {
  display: none;
  position: absolute;
  bottom: 40px;
  z-index: 30;
  background-color: white;
  border: solid black 1px;
  padding: 4px;
  font-size: 12px;
  justify-content: center;
}

.close {
  position: absolute;
  right: 0;
  margin: 10px;
  display: flex;
  z-index: 30;
}

.person {
  position: absolute;
  padding: 0px 2px 0px 2px;
  bottom: 4rem;
  right: 0;
  border: none;
  background-color: rgb(255, 247, 216);
  border-radius: 5px;
  z-index: 10;
  margin-right: 10px;
  cursor: pointer;
}

.person:hover {
  background: rgb(255, 236, 170);
}

.person:active {
  background: rgb(255, 236, 170);
  box-shadow: 2px 2px 5px #fc894d;
}

.hidepoint {
  padding: 10px;
  margin-right: 10px;
  z-index: 20;
  position: absolute;
  bottom: 7rem;
  right: 0;
  background-color: rgb(240, 246, 213);
  display: none;
  font-size: 13px;
}

.person:hover+.hidepoint {
  display: block;
}

.hidetour {
  padding: 10px;
  margin-right: 10px;
  z-index: 20;
  position: absolute;
  bottom: 7rem;
  right: 2rem;
  background-color: rgb(226, 249, 228);
  display: none;
  font-size: 13px;
}

.tour {
  position: absolute;
  padding: 0px 2px 0px 2px;
  bottom: 4rem;
  right: 3rem;
  border: none;
  background-color: rgb(226, 249, 228);
  border-radius: 5px;
  z-index: 10;
  margin-right: 10px;
  cursor: pointer;
}

.tour:hover {
  background: rgb(188, 242, 203);
}

.tour:active {
  background: rgb(211, 255, 223);
  box-shadow: 2px 2px 5px #92ee96;
}

.tour:hover+.hidetour {
  display: block;
}</style>