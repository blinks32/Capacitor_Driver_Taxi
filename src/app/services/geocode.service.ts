import { Injectable } from '@angular/core';
import { Client } from '@googlemaps/google-maps-services-js';
import { environment } from 'src/environments/environment';
import { OverlayService } from './overlay.service';
declare let google;

@Injectable({
  providedIn: 'root'
})
export class GeocodeService {
  service = new google.maps.DistanceMatrixService();
  directions = new google.maps.DirectionsService();

  constructor(private client: Client, private overlay: OverlayService) { }

  //convert the lat and lng numbers to an actual address
  async getAddress(lat: number, lng: number){
    try{
   const address = await this.client
     .reverseGeocode({
     params: {
       latlng: { lat: lat, lng: lng },
       key: environment.apiKey,
     },
     timeout: 5000, // milliseconds
   })
   console.log(address);
   return address
    }catch(e){
      this.overlay.showAlert('GeoError', e);
    }
  }

    //convert the address to lat and lng
  async getLatLng(addressi){
    try{
   const latlng = await this.client.geocode({
     params: {
       address: addressi,
       key: environment.apiKey,
     },
     timeout: 5000, // milliseconds
   })
  return latlng
    }catch(e){
      this.overlay.showAlert('GeoError', e);
      console.log(e);
    }
  }



  //Get the distance between the origin and destination
  async getDirections(from, to){
    try{
    
    }catch(e){
      this.overlay.showAlert('GeoError', e)
      console.log(e)
    }
  }

}
