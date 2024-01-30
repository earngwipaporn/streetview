import { defineStore } from 'pinia'
import axios from 'axios'

export const useImageStore = defineStore('image', {
  state: () => ({
    images : [],
  }),
  actions: {
    async loadImage() {
      try {
        const results = await axios.get('http://localhost:3001/api/panorama')
        this.images = results.data.data

        for (let i=0; i<this.images.length; i++) {
          this.images[i].image = 'data:image/jpeg;base64, ' + this.images[i].image
        }
      } catch (error) {
        console.log(error)
      }
    },
    async loadTour() {
      try {
        const results = await axios.get('http://localhost:3001/api/tour')
        this.tours = results.data.data

        for (let i=0; i<this.tours.length; i++) {
          this.tours[i].image = 'data:image/jpeg;base64, ' + this.tours[i].image
        }
        // console.log(this.tours)
      } catch (error) {
        console.log(error)
      }
    }
  }
})
