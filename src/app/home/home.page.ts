import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { ModalController, Platform, NavController } from '@ionic/angular';
import { OverlayService } from '../services/overlay.service';
import { GeocodeService } from '../services/geocode.service';
import { MapService } from '../services/map.service';
// import { Marker } from '@capacitor/google-maps';
import { AvatarService } from '../services/avatar.service';
import { Drivers } from '../interfaces/drivers';

import { interval, Observable, timer } from 'rxjs';
import { doc, docData, Firestore, onSnapshot, orderBy, where } from '@angular/fire/firestore';
import { Marker } from '@capacitor/google-maps';
import { Auth } from '@angular/fire/auth';
import { collection, query } from '@firebase/firestore';

declare var google;


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  
  profile = null;
  @ViewChild('map') mapRef: ElementRef<HTMLElement>;
  mappy; 
  @ViewChild('mapElement') mapElement:  ElementRef<HTMLElement>;
  address: any = 'Unknown';
  bookingStage: any;
  confirmStage: any;
  trackingStage: any;
  drivingToDestinationStage: any;
  data: any;
  cash: any = false;
  state: any = [];
  mapPinStage: boolean;
  D_LatLng: { lat: any; lng: any; };
  mapPinDrag: any;
  showResetLocationButton: any = false;
  showloader: boolean;
  mapClass: any;
  destinationAddress: string = 'Drag To Pick Destination';
  locationAddress: string = 'Loading...';
  distance: any;
  direction: any;
  actualDestination: any;
  markers: any;
  allDrivers: Observable<Drivers[]>;
  NoDrivers: boolean;
  driverMarker: string;
  driver_duration_apart: number;
  driver_number_of_seats: any;
  price: any = 0;
  carname: any;
  driver_ID: any;
  bounds: any;
  DriverLatLng: { lat: any; lng: any; };
  driver_marker: any;
  drivers_Requested: any[];
  current_Request_Number: number = -1;
  Driver_Rejected: any;
  numCalls: any;
  currentDriver: any;
  unsubscribe: import("@angular/fire/firestore").Unsubscribe;
  driverInfo: import("@angular/fire/firestore").DocumentData;
  currentState: boolean;
  duration: any;
  riderCleared: any;
  updateDriverSubcription: any;
  canCheck: boolean;
  rider_marker: any;
  marker1: any;
  marker2: any;
  actualLocation: string;
  LatLng: { lat: number; lng: number; };
  mapy: boolean;
  AllCarMarkers: Marker[];
  _carmarkers: any[];
  cards: import("@angular/fire/firestore").DocumentData[];
  selected: any;
  selectedCard: any;
  closeDrivers: any;
  approve: boolean = true;

  canStart: any;
  countDown: any;
  riderLocation: any;
  riderDestination: any;
  acceptedState: boolean = false;
  distanceText: any;
  durationText: any;
  driverCleared: boolean;
  FCOUNT: boolean;
  riderInfo: import("@angular/fire/firestore").DocumentData;
  earnings: any;
  coordinates: Position;


  constructor(private auth: Auth, public map: MapService, private nav: NavController, private platform: Platform, private firestore: Firestore, private readonly database: AvatarService, private ngZone: NgZone, private geocode: GeocodeService, private overlay: OverlayService, private modalCtrl: ModalController) {}


  //start the scene
  async ngOnInit() {
   try{
    this.EnterBookingStage();
    await Geolocation.checkPermissions();
    const coordinates = await Geolocation.getCurrentPosition({enableHighAccuracy: true});
    this.coordinates = coordinates;
    
   await this.map.createMap(this.mapRef.nativeElement, coordinates);
   this.mapy = true;


this.LatLng = {
  lat: coordinates.coords.latitude,
  lng: coordinates.coords.longitude
}

this.D_LatLng =  {
  lat: coordinates.coords.latitude,
  lng: coordinates.coords.longitude
}

this.database.getEarnings().subscribe(async (d)=>{
  this.earnings = d.Earnings;
  this.currentState = this.database.profile.onlineState;
})

//get all the list of cards
   this.database.getCards().subscribe(async (d)=>{
    this.cards = d
    this.approve = false;
   // await this.database.deleDriverFromRequest(this.database.profile.Driver_id)
    this.cards.forEach(element => {
     console.log(element);
      if (element.selected == true){
       this.selected = element
       this.selectedCard = element.name;
       console.log(this.selectedCard);
      }
    });
})


this.auth.onAuthStateChanged((user)=>{

  // timer(10000).subscribe(async ()=>{
  //   await this.database.RequestRideWithRiderDetails(this.LatLng, this.D_LatLng, user.uid);
  //   this.startTimer(10);
  //  })
///Listen for requests from riders
  const unsub = onSnapshot(doc(this.firestore, "Request", user.uid), async (doc) => {
   
  this.riderInfo = doc.data();

  if (this.riderInfo != undefined){

  console.log(this.riderInfo)

  if (this.riderInfo.cancel == false){
  if (!this.acceptedState){
    if (this.riderInfo.countDown <= 1){
      this.ClearRide();
      this.FCOUNT = true;
    }else{
   this.EnterConfirmStage();

  if (this.riderInfo.cash == true)
  this.cash = true;
   this.getDistanceandDirections(doc.data());
   this.map.newMap.enableCurrentLocation(false);
    }
  }else{

    if (this.riderInfo.start == true && this.riderInfo.Driver_car){

      this.EnterDrivingToDestinationStage()
      this.getDistanceandDirections(doc.data());
   
    }else if (this.riderInfo.stop == true && this.riderInfo.Driver_car){
      this.EnterBookingStage();
      this.ReturnHome();
     
      this.EndRide(doc.data());
    }else{
      if (this.riderInfo.Driver_car){
      this.EnterTrackingStage();
      this.getDistanceandDirections(doc.data());
      }
    }
    

  }
}else{
  if (!this.driverCleared && !this.FCOUNT){
    this.ClearRide();
   this.overlay.showAlert('Cancelled', 'Rider cancelled')
  }
   
  if (this.FCOUNT){  
    this.overlay.showAlert('Lost', 'You Lost the Ride');
    await this.database.deleDriverFromRequest(this.auth.currentUser.uid)
   }

}
  }
   });

   

 });



      this.actualLocation = this.map.actualLocation;
      this.locationAddress = this.map.locationAddress
              
            
    this.map.newMap.setOnCameraIdleListener((g) => {
      this.ngZone.run(()=>{
        this.showResetLocationButton = true;
      })
    })
  }catch(e){
    this.overlay.showAlert('Error', e)
  }
       
}
  async EndRide(user) {
    let Drivershare = 80/100 * user.price;
    let amt = user.price-Drivershare
    this.overlay.showLoader('Ending Ride..');
    await this.database.createHistory(user)
    await this.database.deleDriverFromRequest(this.auth.currentUser.uid)
    await this.database.updateEarnings( amt + this.earnings)
    this.SwitchOn();
    this.overlay.hideLoader();
  }




startTimer(sec) {
    let nop = interval(1000).subscribe(async ()=>{
      await this.database.UpdateCountDown(sec)
     sec--;
     if(sec == 0)
     {
         nop.unsubscribe();
     }
   })
}

ionViewDidLeave() {
    // this.map.newMap.close();
}


  async chooseCard(even){
    console.log(even);
     this.overlay.showLoader('Selcting Card..');
     await this.database.updateCArd(this.selected.name, this.selected.number, this.selected.type, this.selected.id, false)
    this.cards.forEach(async element => {
      console.log(element);
       if (element.name == even){
      await this.database.updateCArd(element.name, element.number, element.type, element.id, true)
       this.overlay.hideLoader();
       }
       })
  }


async AcceptRide(){
  try{

    this.acceptedState = true;

    if (this.distanceText){
  
await this.overlay.showLoader('');

await this.database.PushDriverToRequest(this.coordinates, this.database.profile.Driver_name, this.database.profile.Driver_email, this.database.profile.Driver_phone, this.database.profile.Driver_car, this.database.profile.Driver_cartype, this.database.profile.Driver_plate, this.database.profile.Driver_imgUrl, this.database.profile.Document);

this.EnterTrackingStage();
this.overlay.hideLoader();
    }
}catch(e){
   this.overlay.showAlert('Error', e)
}
  
  
}

  //reset the map to the user location view
 async resetLocation(): Promise<void>{
  console.log(this.LatLng);
  await this.map.newMap.setCamera({
    animate: true,
    animationDuration: 500,
    zoom: 15,
    coordinate: this.LatLng
  });
  this.showResetLocationButton = false;
}

async PickUp(){
   this.overlay.showLoader('Picking Up..');
   await this.database.PickRider();
   this.overlay.hideLoader()
}


async DropOff(){
  await this.database.EndRide();
}


async Navigate(){

}



async SwitchOff(){
  this.approve = true;
  await this.database.updateOnlineState(false);
  this.approve = false;
  this.currentState = false;
}

async SwitchOn(){
  this.approve = true;
  await this.database.updateOnlineState(true);
  this.approve = false;
  this.currentState = true;
}


  
///get the distance and directions to destination
  async getDistanceandDirections(_d)
  {

    if (!this.canStart){
    
      this.canStart = true;
  
     var origin1 = new google.maps.LatLng(this.LatLng.lat, this.LatLng.lng);
     var origin2 = new google.maps.LatLng(_d.Loc_lat, _d.Loc_lng);

     this.D_LatLng =  {
      lat: _d.Loc_lat,
      lng: _d.Loc_lng
    }

     var request = {
      origin: origin1,
      destination: origin2,
      travelMode: google.maps.TravelMode.DRIVING,
    };
          this.geocode.directions.route(request, async (response, status) => {
            console.log(status, response)

             if (status == 'OK')
             {
               this.direction = response;
               
               this.canStart = false;
               this.distance = response.routes[0].legs[0].distance.value

               this.distanceText = response.routes[0].legs[0].distance.text;
               this.durationText = response.routes[0].legs[0].duration.text;

               this.bounds = response.routes[0].bounds;
               
               await this.createAndAddMarkers(this.LatLng, this.D_LatLng, this.bounds);
             
             }

          }) 
        
        }
  }




  //Return to Map page
  async ReturnHome(){
    this.canStart = false;
    this.distanceText = null;
    this.durationText = null;
    this.FCOUNT = false;
    // this.driverCleared = false;
    this.riderInfo = null;

      if (this.marker1){
      await this.map.newMap.removeMarker(this.marker1);
      this.marker1 = null;
      console.log('removed ', this.marker1)
      }
    
      if (this.marker2){
      await this.map.newMap.removeMarker(this.marker2);
      this.marker2 = null
      console.log('removed ', this.marker2)
      }
    this.EnterBookingStage();
      await this.map.newMap.setCamera({
        animate: true,
        animationDuration: 500,
        zoom: 15,
        coordinate: this.LatLng
       
      })
  }

//Cancel the Current Ride Request.....
  async CancelRide(){
    this.driverCleared = true;
    this.overlay.showLoader('Cancelling Ride..');
    await this.database.RejectRider();
    await this.database.deleDriverFromRequest(this.auth.currentUser.uid)
   this.overlay.hideLoader();
   this.overlay.showAlert('Cancelled', 'You cancelled')
    this.ReturnHome()
  }

  async ClearRide(){
    this.overlay.showLoader('Clearing Ride..');
    await this.database.RejectRider();
    await this.database.deleDriverFromRequest(this.auth.currentUser.uid)
    this.overlay.hideLoader();
    this.ReturnHome();
  }

  ///create markers and possition them in the view of the user
  async createAndAddMarkers(loc, des, bounds){

    if (!this.marker1){
    this.marker1 = await this.map.newMap.addMarker({
      coordinate: loc,
       iconUrl: 'https://i.ibb.co/KDy365b/hatchback.png',
       title: 'My 2',
  });
}else{
  //this.marker1.coordinate(loc);
}

  if (!this.marker2){
  this.marker2 = await this.map.newMap.addMarker({
   coordinate: des,
     iconUrl: 'https://i.ibb.co/bWx9V64/favourite.png',
     title: 'My 2',
});
  }else{
    //this.marker2.coordinate(des);
  }



       const locs = [
        {
          geoCode: {
            latitude: loc.lat,
            longitude: loc.lng
          }
        },
        {
          geoCode: {
            latitude: des.lat,
            longitude: des.lng
          }
        }
      ];

      await this.map.newMap.setPadding({
        top: 300,
        left:150,
        right:150,
        bottom: 1200
      })

      let go = {
        lat: (await this.map.CalculateCenter(locs)).latitude,
        lng: (await this.map.CalculateCenter(locs)).longitude
      }

      let mapDim = {
        height: this.mapRef.nativeElement.offsetHeight/2,
        width: this.mapRef.nativeElement.offsetWidth
      }
        await this.map.newMap.setCamera({
          animate: true,
          animationDuration: 500,
          zoom: await this.map.getBoundsZoomLevel(bounds, mapDim),
          coordinate: go,
          bearing: 0
        })
  }


  //Timer Animation


  EnterBookingStage() 
  {
    this.bookingStage = true
    this.confirmStage = false;
    this.trackingStage = false;
    this.mapPinStage = false;
    this.drivingToDestinationStage = false;
  }


  EnterConfirmStage() {
    this.bookingStage = false;
    this.confirmStage = true;
    this.trackingStage = false;
    this.mapPinStage = false;
    this.drivingToDestinationStage = false;
  }

  EnterSearchingStage() {
    this.bookingStage = false;
    this.confirmStage = false;
    this.trackingStage = false;
    this.mapPinStage = false;
    this.drivingToDestinationStage = false;
  }

  EnterNoDriverStage() {
    this.bookingStage = false;
    this.confirmStage = false;
    this.trackingStage = false;
    this.mapPinStage = false;
    this.drivingToDestinationStage = false;
  }

  EnterTrackingStage() {
    this.bookingStage = false;
    this.confirmStage = false;
    this.trackingStage = true;
    this.mapPinStage = false;
    this.drivingToDestinationStage = false;
  }

  EnterDrivingToDestinationStage() {
    this.bookingStage = false;
    this.confirmStage = false;
    this.trackingStage = false;
    this.mapPinStage = false;
    this.drivingToDestinationStage = true;
  }






}
