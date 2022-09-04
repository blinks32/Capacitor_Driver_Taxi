import { Injectable, NgZone } from '@angular/core';
import { throwError } from 'rxjs';
 import { GoogleMap, MapType } from '@capacitor/google-maps';
import { environment } from 'src/environments/environment';
import { GeocodeService } from './geocode.service';
import { OverlayService } from './overlay.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  LatLng: { lat: any; lng: any; };
  locationAddress: string = 'Loading..';
  showResetLocationButton: boolean;
  mapPinStage: any;
  D_LatLng: { lat: any; lng: any; };
  actualLocation: any;
   exampleMapId: any;
  newMap: GoogleMap;

  constructor(private overlay: OverlayService, private geocode: GeocodeService) {
   }

  //create google maps get the map movement listener
  async createMap( ref, coords ) {
    try{
     this.newMap = await GoogleMap.create({
       id: 'my-cool-map',
       element: ref,
       apiKey: environment.apiKey,
       config: {
         center: {
           lat: 5.5122138,
           lng: 7.4919135
         },
         zoom: 8,
       },
     });
 
     this.LatLng =  {
       lat: coords.coords.latitude,
       lng: coords.coords.longitude
     }

     this.newMap.enableTrafficLayer(true);
     
     await this.newMap.setCamera({
       animate: true,
       animationDuration: 500,
       zoom: 15,
       coordinate: this.LatLng
     })
        const address = await this.geocode.getAddress(this.LatLng.lat, this.LatLng.lng)
        this.actualLocation = address.data.results[0].formatted_address;
        this.locationAddress = address.data.results[1].address_components[0].long_name + ' ' + address.data.results[1].address_components[1].long_name;
        this.newMap.enableCurrentLocation(true);
   }catch(e){
      this.overlay.showAlert('Error', e)
   }
 }

 


 async CalculateCenter(locations) {
  var latitude = 0,
    longitude = 0;

  for (var location of locations) {
    longitude += location.geoCode.longitude;
    latitude += location.geoCode.latitude;
  }
  latitude = latitude / locations.length;
  longitude = longitude / locations.length;
  await latitude, longitude
  return {
    latitude,
    longitude
  };
}

async getBoundsZoomLevel(bounds, mapDim) {
  var WORLD_DIM = { height: 256, width: 256 };
  var ZOOM_MAX = 21;

  function latRad(lat) {
      var sin = Math.sin(lat * Math.PI / 180);
      var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();

  var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

  var lngDiff = ne.lng() - sw.lng();
  var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

  var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
  var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

  await Math.min(latZoom, lngZoom, ZOOM_MAX);
  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}



 
 
 
}
