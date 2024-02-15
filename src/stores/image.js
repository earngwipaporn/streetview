import { defineStore } from 'pinia'
import axios from 'axios'

export const useImageStore = defineStore('image', {
  state: () => ({
    images : [],
    tours : [],
    groupedByTourId: [],
  }),
  actions: {
    async loadImage() {
      try {
        const results = await axios.get('http://localhost:3001/api/panorama')
        this.images = results.data.data

        for (let i=0; i<this.images.length; i++) {
          this.images[i].image = 'data:image/jpeg;base64, ' + this.images[i].image
        }
        return this.images
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
        const groupedByTourId = {};
 
        for (const tour of this.tours) {
            const tourId = tour.tour_id;
            if (!groupedByTourId[tourId]) {
              groupedByTourId[tourId] = [tour];
            } else {
              groupedByTourId[tourId].push(tour);
            }
        }
        
        const resultArray = Object.values(groupedByTourId);
        this.groupedByTourId = resultArray
        console.log(resultArray);
        return this.tours
      } catch (error) {
        console.log(error)
      }
    }
  }
})
