import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AvatarService } from 'src/app/services/avatar.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';


@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {

  form: FormGroup;
  coordinates: any;
  approve2: boolean;
  selected: any = 'Select Car Type';
  cartypes: import("@angular/fire/firestore").DocumentData[];
  currentcar: any;
  imageURl: any;
  licenseURl: any;
  licenseImage: any;
  profileImage: any;
  constructor(
    private overlay: OverlayService, private authy: Auth, private auth: AuthService, private avatar: AvatarService, private router: Router
  ) { }

  ngOnInit() {

     this.avatar.getCartypes().subscribe((d)=>{
      console.log(d);
      this.cartypes = d
     })

    this.form = new FormGroup({
      fullname: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)]
      }),
      lastname: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)]
      }),
      email: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)]
      }),
      car: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)]
      }),
      plate: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)]
      }),
    });
  }
  

  async chooseCarType(even){
    console.log(even.detail.value);
      this.currentcar = even.detail.value.name
  }

  async changeImage() {
    try{
    const image = await Camera.getPhoto({
      quality: 20,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera, // Camera, Photos or Prompt!
    });
    this.imageURl = image.dataUrl
    this.profileImage = image.dataUrl

  }catch(e){
    this.overlay.showAlert('Error', e)
  }
  }

  async changeLicense() {
    try{
    const image = await Camera.getPhoto({
      quality: 20,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera, // Camera, Photos or Prompt!
    });
    this.licenseURl = image.dataUrl
    this.licenseImage = image.dataUrl;
  }catch(e){
    this.overlay.showAlert('Error', e)
  }
  }




  async signIn() {
    try {
      await Geolocation.checkPermissions();
      const coordinates = await Geolocation.getCurrentPosition();
        this.approve2 = true
        if (this.profileImage && this.licenseImage && this.currentcar && this.form.value.fullname && this.form.value.lastname && this.form.value.email && this.form.value.car && this.form.value.plate && this.imageURl && this.licenseURl){
        await this.avatar.CreateNewDriver(coordinates, this.form.value.fullname + '' + this.form.value.lastname, this.form.value.email, this.authy.currentUser.phoneNumber, this.form.value.car, this.currentcar, this.form.value.plate, this.imageURl, this.licenseURl)
        await this.avatar.createCard('Cash', 0, 'cash', 'None')
        this.approve2 = false;
        this.router.navigateByUrl('tabs');
        }else{
          this.overlay.showAlert('Incomplete', "Complete the form")
        }
    } catch(e) {
      this.overlay.showAlert('Error', e)
    }
  }




}
