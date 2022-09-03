import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { isPlatform, ModalController, ModalOptions, NavController } from '@ionic/angular';
import { OtpComponent } from '../otp/otp.component';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { OverlayService } from '../services/overlay.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { deleteUser, GoogleAuthProvider, signInWithCredential } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth/';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AvatarService } from '../services/avatar.service';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  form: FormGroup;
  CountryCode: any;
  CountryJson = environment.CountryJson;
  flag: any = "https://cdn.kcak11.com/CountryFlags/countries/ng.svg";
  
  user: any;
  approve: boolean;
  approve2: boolean;
  

  slideOpts = {
    initialSlide: 0,
    speed: 300,
    autoplay:true
  };
  numberT: string;
  constructor(
    private modalCtrl: ModalController,
    private auth: AuthService,
    private router: Router,
    private nav: NavController,
    private authY: Auth,
    private avatar: AvatarService,
    private overlay: OverlayService,
  ) 
  { 
    if (!isPlatform('capacitor')){
      GoogleAuth.initialize();
     }
    let country = 'Nigeria'
     this.CountryCode = '+234'
     this.numberT = '+234'
  }

  async HideSplash()
  {
    await SplashScreen.hide();
  }

  

  async ngOnInit() {
    
   
   
    this.form = new FormGroup({
      phone: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(10), Validators.maxLength(10)]
      }),
    });

    // this.router.navigateByUrl('details');
   // this.show();
  }

  countryCodeChange($event) {
    console.log($event.detail.value.toString());
    this.CountryCode = '';
    this.numberT = $event.detail.value.toString();
  }

  async Show(){
    await StatusBar.setOverlaysWebView({ overlay: false });
    // StatusBar.setStyle({ style: Style.Light });
  }

  async Hide(){
    await StatusBar.setOverlaysWebView({ overlay: true });
    // StatusBar.setStyle({ style: Style.Light });
  }



  async signIn() {
    try {
      if (!this.form.valid) {
        this.form.markAllAsTouched();
        return;
      }
      console.log(this.form.value);
      this.approve2 = true;
      const response = await this.auth.signInWithPhoneNumber(this.numberT + this.form.value.phone);
      this.approve2 = false;
      const options: ModalOptions = {
        component: OtpComponent,
        componentProps: {
          phone: this.form.value.phone,
          countryCode: this.numberT,
        },
        swipeToClose: true
      };
      const modal = this.modalCtrl.create(options);
      (await modal).present();
      const data: any = (await modal).onWillDismiss();
      this.authY.onAuthStateChanged(async (user)=>{
        this.avatar.getUserProfile(user).subscribe(async (data) => {
        if (!data){
       this.router.navigateByUrl('details');   
       this.overlay.hideLoader();
        }else{
          this.router.navigateByUrl('tabs');   
       this.overlay.hideLoader();
        }
        })
      })
       console.log(data);
    } catch(e) {
      console.log(e);
      this.overlay.showAlert('Error', JSON.stringify(e));
      this.approve2 = false;
    }
  }

 

}
