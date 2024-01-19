<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'

import { useImageStore } from '@/stores/image'

const imageStore = useImageStore()
const streetViewMode = ref(false)
const mode = ref('point')
var map
var viewer
const loadmap = async () => {
  try {
    map = new sphere.Map({
      placeholder: document.getElementById('map')
    })
    await map.goTo({ center: { lon: 100.928076, lat: 13.103024 }, zoom: 18 });

    map.Event.bind(sphere.EventName.OverlayClick, async function (e) {
      map.Overlays.clear();
      if (viewer) {
        console.log(viewer.getRenderer())
        await viewer.destroy()
        console.log('destroy')
      }
      await pointmaker()
      console.log(e._geojson.geometry.coordinates[1], e._geojson.geometry.coordinates[0])
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
      await map.goTo({ center: { lon: Number(lon) + 0.001, lat: lat }, zoom: 18 });
      var image_source
      var image_name
      for (let i = 0; i < imageStore.images.length; i++) {
        // if (imageStore.images[i].type !== 'tour') {
        if (lat === imageStore.images[i].lat && lon === imageStore.images[i].lon) {
          image_source = await imageStore.images[i].image
          image_name = await imageStore.images[i].name
        }
        // }
      }
      viewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": `${image_source}`,
        "autoLoad": true,
        "compass": true,
        "showControls": false,
        "previewTitle": `${image_name}`,
        "previewAuthor": 'earngqqw'
      });

      var point

      point = new sphere.Marker({ lon: lon, lat: lat },
        {
          title: 'test',
          icon: {
            html: '<img src="/streetview/marker.png" style="width: 3rem">',
            offset: { x: 0, y: -30 }
          }
        });
      await map.Overlays.add(point);
      await viewer.loadScene();
    }

    // tour mode
    else {

      var min_length = 10000
      var index
      for (let i = 0; i < imageStore.images.length; i++) {
        if (imageStore.images[i].type === 'tour') {
          var polyline = new sphere.Polyline([
            { lon: lon, lat: lat },
            { lon: imageStore.images[i].lon, lat: imageStore.images[i].lat },
          ])

          const length = parseFloat(polyline.size('th').split(' ')[0] / 1000)
          if (length < min_length) {
            min_length = length
            index = i
          }
        }
      }

      await map.goTo({ center: { lon: Number(imageStore.images[index].lon) + 0.001, lat: imageStore.images[index].lat }, zoom: 18 });

      viewer = pannellum.viewer('panorama', {
        "default": {
          "firstScene": `${imageStore.images[index].id}`,
          "sceneFadeDuration": 1000,
          "autoLoad": true,
          "author": "earngqqw",
          "compass": true,
          "preview": 'preview',
          "previewTitle": `${imageStore.images[index].name}`,
          "showControls": false,
          "northOffset": 31
        },

        "scenes": {
          [imageStore.images[4].id]: {
            "title": `${imageStore.images[4].name}`,
            "yaw": imageStore.images[4].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[4].image}`,
            "northOffset": imageStore.images[4].yaw + 31,
            "hotSpots": [
              {
                "yaw": imageStore.images[5].yaw,
                "type": "scene",
                "text": `${imageStore.images[5].name}`,
                "sceneId": `${imageStore.images[5].id}`
              }
            ]
          },

          [imageStore.images[5].id]: {
            "title": `${imageStore.images[5].name}`,
            "yaw": imageStore.images[5].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[5].image}`,
            "northOffset": imageStore.images[5].yaw + 31,
            "hotSpots": [
              {
                "yaw": imageStore.images[6].yaw,
                "type": "scene",
                "text": `${imageStore.images[6].name}`,
                "sceneId": `${imageStore.images[6].id}`
              },
              {
                "yaw": 180 - imageStore.images[4].yaw,
                "type": "scene",
                "text": `${imageStore.images[4].name}`,
                "sceneId": `${imageStore.images[4].id}`,
                "targetYaw": 180
              }

            ]
          },

          [imageStore.images[6].id]: {
            "title": `${imageStore.images[6].name}`,
            "yaw": imageStore.images[6].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[6].image}`,
            "northOffset": imageStore.images[6].yaw + 31,
            "hotSpots": [
              {
                "yaw": 180 - imageStore.images[5].yaw,
                "type": "scene",
                "text": `${imageStore.images[5].name}`,
                "sceneId": `${imageStore.images[5].id}`,
                "targetYaw": 180,
              },
              {
                "yaw": imageStore.images[7].yaw,
                "type": "scene",
                "text": `${imageStore.images[7].name}`,
                "sceneId": `${imageStore.images[7].id}`,
                "targetYaw": 0,
              }
            ]
          },

          [imageStore.images[7].id]: {
            "title": `${imageStore.images[7].name}`,
            "yaw": `${imageStore.images[7].yaw}`,
            "type": "equirectangular",
            "panorama": `${imageStore.images[7].image}`,
            "northOffset": imageStore.images[7].yaw + 31,
            "hotSpots": [
              {
                "yaw": 180 - imageStore.images[6].yaw,
                "type": "scene",
                "text": `${imageStore.images[6].name}`,
                "sceneId": `${imageStore.images[6].id}`,
                "targetYaw": 180,
              },
              {
                "yaw": imageStore.images[8].yaw,
                "type": "scene",
                "text": `${imageStore.images[8].name}`,
                "sceneId": `${imageStore.images[8].id}`,
                "targetYaw": imageStore.images[8].yaw,
              }
            ]
          },
          [imageStore.images[8].id]: {
            "title": `${imageStore.images[8].name}`,
            "yaw": imageStore.images[8].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[8].image}`,
            "northOffset": imageStore.images[7].yaw + 31,
            "hotSpots": [
              {
                "yaw": imageStore.images[9].yaw,
                "type": "scene",
                "text": `${imageStore.images[9].name}`,
                "sceneId": `${imageStore.images[9].id}`,
                "targetYaw": imageStore.images[9].yaw,
              },
              {
                "yaw": 180 - imageStore.images[7].yaw,
                "type": "scene",
                "text": `${imageStore.images[7].name}`,
                "sceneId": `${imageStore.images[7].id}`,
                "targetYaw": 180,
              }
            ]
          },
          [imageStore.images[9].id]: {
            "title": `${imageStore.images[9].name}`,
            "yaw": imageStore.images[9].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[9].name}`,
            "northOffset": imageStore.images[7].yaw + 31,
            "hotSpots": [
              {
                "yaw": 180 - imageStore.images[8].yaw,
                "type": "scene",
                "text": `${imageStore.images[8].name}`,
                "sceneId": `${imageStore.images[8].id}`,
                "targetYaw": 180,
              },
              {
                "yaw": imageStore.images[10].yaw,
                "type": "scene",
                "text": `${imageStore.images[10].name}`,
                "sceneId": `${imageStore.images[10].id}`,
                "targetYaw": 0,
              }
            ]
          },
          [imageStore.images[10].id]: {
            "title": `${imageStore.images[10].name}`,
            "yaw": imageStore.images[10].yaw,
            "type": "equirectangular",
            "panorama": `${imageStore.images[10].image}`,
            "northOffset": (imageStore.images[10].yaw + 31),
            "hotSpots": [
              {
                "yaw": 180 - imageStore.images[9].yaw,
                "type": "scene",
                "text": `${imageStore.images[9].name}`,
                "sceneId": `${imageStore.images[9].id}`,
                "targetYaw": 180,
              }
            ]
          }
        }
      });
      await personmaker(lon, lat)
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
    console.log(viewer.getRenderer())
  } catch (error) {
    console.log(error)
  }
}

const loadTour = async () => {
  // var image_source
  // await map.goTo({ center: { lon: Number(lon) + 0.004, lat: lat }, zoom: 16 });
  // for (let i = 0; i < imageStore.images.length; i++) {
  //   if (lat === imageStore.images[i].lat && lon === imageStore.images[i].lon) {
  //     image_source = imageStore.images[i].image
  //   }
  // }
  mode.value = 'tour'
  await map.goTo({ center: { lon: 100.578696, lat: 13.845183 }, zoom: 18 })
  // await personmaker()

  // linemaker()
  mapToggle()

  await map.goTo({ center: { lon: 100.578696, lat: 13.845183 }, zoom: 18 })


}

const pointmaker = async () => {
  for (let i = 0; i < imageStore.images.length; i++) {
    var marker
    marker = new sphere.Marker({ lon: imageStore.images[i].lon, lat: imageStore.images[i].lat },
      {
        title: `${imageStore.images[i].name}`,
        icon: {
          html: '<img src="/streetview/point.png" style="width: 1rem">'
        }
      });
    await map.Overlays.add(marker);
  }
}

const personmaker = async (lon, lat) => {
  var marker2
  marker2 = new sphere.Marker({ lon: lon, lat: lat },
    {
      title: 'point',
      icon: {
        html: '<img src="/streetview/person.png" style="width: 3rem;">',
        offset: { x: 0, y: -10 }
      },
      draggable: true
    });

  await map.Overlays.add(marker2);
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

onMounted(async () => {
  loadmap()
  await imageStore.loadImage()
})
</script>

<template>
  <!-- map -->
  <div id="map">
    <button class="person" @click="mapToggle"><img src="/streetview/person.png"></button>
    <div class="hidepoint">Start streetview!</div>
    <div id="toast"><img src="/point.png">select a point where you want to see streetview</div>
    <button class="tour" @click="loadTour"><img src="/streetview/person.png"></button>
    <div class="hidetour">Start tour!</div>
  </div>
  <!-- panorama -->
  <div id="container">
    <div id="panorama"></div>
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


/* .custom-hotspot {
  background-image: url('/point.png');
  height: 50px;
  width: 50px;
  background-color: rgb(255, 247, 216);
} */

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
}
</style>