import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { collection, collectionData, CollectionReference, doc, docData, DocumentData, endAt, Firestore, getDocs, DocumentChange, orderBy, query, setDoc, startAt, updateDoc, onSnapshot, deleteDoc, serverTimestamp, addDoc } from '@angular/fire/firestore';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadString,
} from '@angular/fire/storage';
import { Photo } from '@capacitor/camera';
import { distanceBetween, geohashForLocation, geohashQueryBounds} from 'geofire-common';
import { Observable } from 'rxjs';
import { Card } from '../interfaces/card';
import { Drivers } from '../interfaces/drivers';
import { Rider } from '../interfaces/rider';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AvatarService {
  
  private driverCollection: CollectionReference<DocumentData>;
  directory: any;
  userUID: string;
  userName: string;
  userEmail: string;
  profile: DocumentData;
  pathM: string;

  constructor(
    private auth: Auth,
    public firestore: Firestore,
    private storage: Storage,
    private authService: AuthService
  ) {
    this.auth.onAuthStateChanged((user)=>{
      if (user){
      this.driverCollection = collection(this.firestore, 'Drivers');

    

     this.getUserProfile(user).subscribe(async (data) => {
      this.profile = data;

      if (this.profile){
      if (!this.profile.Driver_phone)
      // await this.authService.logout();

      if (this.profile.Driver_name)
      this.userName = this.profile.Driver_name;

      this.pathM = `uploads/${this.profile.uid}/profile.png`;
      }
     })
     
    }else{
      this.userName = "None";
      
    }
  })
  }

   getUserProfile(user) {
    const userDocRef = doc(this.firestore, `Drivers/${user.uid}`);
     return docData(userDocRef);
  }


  async RequestRideWithRiderDetails(user_Loc_coord, user_Des_coord, ID){
    try{
      const loc: Rider = {
        Loc_lat: 5.5096,
        Loc_lng: 7.0391,
        Rider_id: 'syusyugdshgsghdsdssd',
        Rider_name: "Chinedu",
        Rider_phone: 6478947352,
        Rider_imgUrl: "https://avatars.githubusercontent.com/u/7928001?v=4",
        Rider_rating: 3,
        Des_lat: user_Des_coord.lat,
        Des_lng: user_Des_coord.lng,
        Rider_Location: 'Owerri Imo State',
        Rider_Destination: 'Kenville Hotels Amabar',
        Rider_email: 'chndht@gmiail.ccjd',
        countDown: 10,
        cancel: false,
        price: 2230,
        cash: true,
        time: ''
      };
     
      const userDocRef = doc(this.firestore, 'Drivers', ID)
      await updateDoc(userDocRef, {onlineState: false});
      console.log('deleted current driver ID');
      await setDoc(doc(this.firestore, "Request",  ID), { ...loc});
      console.log('Added New driver ID');
    }catch(e){
      throw new Error(e);
    }
  }


  async RejectRider(){
    try {
      const userDocRef = doc(this.firestore, "Request",  this.auth.currentUser.uid)
      await updateDoc(userDocRef, {
        cancel: true,
        start: false
      });
      this.updateOnlineState(true);
      return true;
    } catch (e) {
      alert(e)
      return null;
    }
  }

  async PickRider(){
    try {
      const userDocRef = doc(this.firestore, "Request",  this.auth.currentUser.uid)
      await updateDoc(userDocRef, {
        start: true,
      });
      // this.updateOnlineState(true);
      return true;
    } catch (e) {
      alert(e)
      return null;
    }
  }


  async EndRide(){
    try {
      const userDocRef = doc(this.firestore, "Request",  this.auth.currentUser.uid)
      await updateDoc(userDocRef, {
        stop: true,
        start: false
      });
      // this.updateOnlineState(true);
      return true;
    } catch (e) {
      alert(e)
      return null;
    }
  }


  async createHistory(user){
      try{
        const loc: Rider = {
          Loc_lat: user.Loc_lat,
          Loc_lng: user.Loc_lng,
          Rider_id: user.Rider_id,
          Rider_name: user.Rider_name,
          Rider_phone: user.Rider_phone,
          Rider_imgUrl: user.Rider_imgUrl,
          Rider_rating: user.Rider_rating,
          Des_lat: user.Des_lat,
          Des_lng: user.Des_lng,
          Rider_Location: user.Rider_Location,
          Rider_Destination: user.Rider_Destination,
          Rider_email: user.Rider_email,
          countDown: 0,
          cancel: false,
          price: user.price,
          cash: user.cash,
          time: serverTimestamp(),
        };
        await setDoc(doc(this.firestore, "Drivers",  `${this.auth.currentUser.uid}/History/${user.Rider_id}`), { ...loc});
        await setDoc(doc(this.firestore, "AllRides",  `${this.auth.currentUser.uid}/customer/${user.Rider_id}`), { ...loc});
      }catch(e){
        alert(e)
      }
    }
  


  //GO offline()

  async goOffline(){
    await deleteDoc(doc(this.firestore, "Drivers", this.auth.currentUser.uid));
  }

//delete the driver that has a request sent to him.
  async deleDriverFromRequest(ID){
    await deleteDoc(doc(this.firestore, "Request", ID))
  }


  async UpdateCountDown(time){
    try {
      const userDocRef = doc(this.firestore, "Request",  this.auth.currentUser.uid)
      await updateDoc(userDocRef, {
        countDown: time,
      });
      return true;
    } catch (e) {
      alert(e)
      return null;
    }
  }


  //Push driver info into the request database
  async PushDriverToRequest(coord, name, email, phone, car, cartype, plate, imageUrl, document){
    try{
    const loc: Drivers = {
      geohash: geohashForLocation([coord.coords.latitude, coord.coords.longitude]),
      Driver_lat: coord.coords.latitude,
      Driver_lng: coord.coords.longitude,
      Driver_id: this.auth.currentUser.uid,
      Driver_name: name,
      Driver_car: car,
      Driver_imgUrl: imageUrl,
      Driver_rating: 0,
      distance: 0,
      duration: 0,
      seats: 1,
      start: false,
      stop: false,
      intransit: false,
      cancel: false,
      Driver_cartype: cartype,
      Driver_plate: plate,
      Driver_num_rides: 0,
      Document: document,
      Driver_email: email,
      Driver_phone: phone,
      onlineState: false,
      Earnings: 0
    };
    await updateDoc(doc(this.firestore, "Request",  this.auth.currentUser.uid), { ...loc});
  }catch(e){
    throw new Error(e);
  }
   
    console.log('done')
  }


  ///create a new driver and publish info to database
  async CreateNewDriver(coord, name, email, phone, car, cartype, plate, imageUrl, document){
    try{
    const loc: Drivers = {
      geohash: geohashForLocation([coord.coords.latitude, coord.coords.longitude]),
      Driver_lat: coord.coords.latitude,
      Driver_lng: coord.coords.longitude,
      Driver_id: this.auth.currentUser.uid,
      Driver_name: name,
      Driver_car: car,
      Driver_imgUrl: imageUrl,
      Driver_rating: 0,
      distance: 0,
      duration: 0,
      seats: 1,
      start: false,
      stop: false,
      intransit: false,
      cancel: false,
      Driver_cartype: cartype,
      Driver_plate: plate,
      Driver_num_rides: 0,
      Document: document,
      Driver_email: email,
      Driver_phone: phone,
      onlineState: false,
      Earnings: 0
    };
    await setDoc(doc(this.firestore, "Drivers",  this.auth.currentUser.uid), { ...loc});
  }catch(e){
    throw new Error(e);
  }
  }


     getDriver() {
      return collectionData(this.driverCollection, {
        idField: 'id',
      }) as Observable<Drivers[]>;
     }


    update(pokemon: Drivers) {
      const pokemonDocumentReference = doc(
        this.firestore,
        `pokemon/${pokemon.Driver_id}`
      );
      return updateDoc(pokemonDocumentReference, { ...pokemon });
    }
  

  async uploadImage(cameraFile: Photo, uid) {
   
    const storageRef = ref(this.storage, this.pathM);

    try {
      await uploadString(storageRef, cameraFile.base64String, 'base64');

      const imageUrl = await getDownloadURL(storageRef);

      const userDocRef = doc(this.firestore, `Drivers/${uid}`);
      await setDoc(userDocRef, {
        imageUrl,
      });
      return true;
    } catch (e) {
      return null;
    }
  }
 
   getMessage() {
    const userDocRef = collection(this.firestore, `Messages/${this.auth.currentUser.uid}/messages`);
    return collectionData(userDocRef);
  }

  getCards() {
    const userDocRef = collection(this.firestore, `Drivers/${this.auth.currentUser.uid}/Cards`);
    return collectionData(userDocRef);
  }

  getEarnings() {
    const userDocRef = doc(this.firestore, `Drivers/${this.auth.currentUser.uid}`);
    return docData(userDocRef);
  }

  getCartypes() {
    const userDocRef = collection(this.firestore, `Cartypes`);
    return collectionData(userDocRef);
  }

  getRequests() {
    const userDocRef = doc(this.firestore,  `Request/${this.auth.currentUser.uid}`);
    return docData(userDocRef);
  }

  getDrivers() {
    const userDocRef = collection(this.firestore, `Drivers`);
    return collectionData(userDocRef);
  }

async addChatMessage(msg) {
  return await addDoc(collection(this.firestore, `Messages/${this.profile.Driver_id}/messages`), {
    msg: msg,
    from: this.auth.currentUser.uid,
    createdAt: serverTimestamp(),
    myMsg: true,
    fromName: this.profile.Driver_name
  });
}


async createCard(name, number, type, id) {
  try {
    const loc: Card = {
      name: name,
      number: number,
      type: type,
      id: id,
      selected: true
    };
    await setDoc(doc(this.firestore, "Drivers",  `${this.auth.currentUser.uid}/Cards/${name}`), { ...loc});
    return true;
  } catch (e) {
    alert(e)
    return null;
  }
  
}

async updateCArd(name, number, type, id, state) {
  try {
    const loc: Card = {
      name: name,
      number: number,
      type: type,
      id: id,
      selected: state
    };
    await updateDoc(doc(this.firestore, "Drivers",  `${this.profile.Rider_id}/Cards/${name}`), { ...loc});
    return true;
  } catch (e) {
    alert(e)
    return null;
  }

}


async updateOnlineState(state) {
  try {
    const userDocRef = doc(this.firestore, 'Drivers', `/${this.auth.currentUser.uid}/`)
    await updateDoc(userDocRef, {
      onlineState: state,
    });
    return true;
  } catch (e) {
    alert(e)
    return null;
  }
}


async updateEarnings(value) {
  try {
    const userDocRef = doc(this.firestore, 'Drivers', `/${this.auth.currentUser.uid}/`)
    await updateDoc(userDocRef, {
      Earnings: value,
    });
    return true;
  } catch (e) {
    alert(e)
    return null;
  }
}

}