import { AuthService } from '../services/auth.service';
import { Component, Input, OnInit } from '@angular/core';
import { LoadingController, ModalController, ModalOptions, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { OverlayService } from '../services/overlay.service';
import { AvatarService } from '../services/avatar.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
})

export class OtpComponent implements OnInit {

  @Input() phone;
  @Input() countryCode;
  isLoading = false;
  otp: string;
  config = {
    length: 6,
    allowNumbersOnly: true,
  };

  constructor(
    public modalCtrl: ModalController,
    public overlay: OverlayService,
    public toastCtrl: ToastController,
    private auth: AuthService,
    private router: Router,
    private avatar: AvatarService,
    ) { }

  ngOnInit() {
    console.log(this.phone);
  }

  onOtpChange(event) {
    this.otp = event;
    console.log(this.otp);
  }

  closeModal(){
    this.modalCtrl.dismiss();
  }

  async resend(): Promise<void> {
    try {
      const response = await this.auth.signInWithPhoneNumber(this.countryCode + this.phone);
      console.log(response);       
    } catch(e) {
      console.log(e);
    }
  }

  async verifyOtp(): Promise<void> {
    try {
      this.overlay.showLoader("");
      const response = await this.auth.verifyOtp(this.otp);
      this.modalCtrl.dismiss(response);
    } catch(e) {
      console.log(e);
    }
  }

}