import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AlertController, NavController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AvatarService } from 'src/app/services/avatar.service';
import { OverlayService } from 'src/app/services/overlay.service';
declare var Stripe;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {
  // stripe = Stripe("pk_test_0t85o0Llo0MbBfC9imSzznam");

  @ViewChild('paymentform',{read:ElementRef}) stripeButton : ElementRef;
  cardpaymentForm: FormGroup;
  public data: any;
  info: any;
  approve: boolean;
  stripe = Stripe('pk_test_0t85o0Llo0MbBfC9imSzznam');
  card: any;
  cards: any[];
  selectedCard: any;
  selected: any;
  skeletOns: {}[];
  cash: any = 'cash'

  constructor( public prof: AvatarService,
    public nav: NavController, private http: HttpClient,
    public alertCtrl: AlertController, private overlay: OverlayService, public formBuilder: FormBuilder) {}



  ionViewDidEnter() {
    this.skeletOns = [
      {},{},{},{},{}
    ]
    this.setupStripe();
   this.prof.getCards().subscribe((d)=>{
       console.log(d);
       this.cards = d

       this.cards.forEach(element => {
        console.log(element);
         if (element.selected == true){
          this.selected = element
          this.selectedCard = element.name;
          console.log(this.selectedCard);
         }
       });
  })
  }

  async chooseCard(event){
    console.log(event);
    this.overlay.showLoader('Please wait..');
    await this.prof.updateCArd(this.selected.name, this.selected.number, this.selected.type, this.selected.id, false)
    await this.prof.updateCArd(event.name, event.number, event.type, event.id, true)
    this.overlay.hideLoader();
  }


  async setupStripe() {
    const appearance = {
      theme: 'flat',
    
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
        // See all possible variables below
      }
    };
    let elements = this.stripe.elements();
    var style = {
      base: {
        color: '#32325d',
        lineHeight: '24px',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '17px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#3880ff'
      }
    };

    this.card = elements.create('card', { style: style });
    this.card.mount('#card-element');

    this.card.addEventListener('change', event => {
      var displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });

    var form = document.getElementById('payment-form');
    form.addEventListener('submit', event => {
      event.preventDefault();
      console.log(event, this.card)
      this.approve = true;

      this.stripe.createSource(this.card).then(async result => {
        this.approve = false;
        if (result.error) {
          var errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          this.overlay.showAlert('Payment Error', result.error.message)
        } else {
          console.log(result.source.id);
          await this.prof.updateCArd(this.selected.name, this.selected.number, this.selected.type, this.selected.id, false)
          await this.prof.createCard(result.source.card.last4, result.source.card.last4, result.source.card.brand, result.source.id)
          this.card.removeEventListener('change', event=>{})
          form.removeEventListener('submit', event=>{})
          await this.overlay.showToast('Successfully Added Card!')
          this.setupStripe()
        //  this.makePayment(result.id);
        }
      });
    });
  }
  




  async showPayMentAlert(title, subtitle, canLeave) {
    const alert = await this.alertCtrl.create({
      header: title,
      subHeader: subtitle,
      buttons: [{
        text: 'Approve',
        role: 'cancel',
        handler: () => {
          if (canLeave) {
            this.nav.pop();
          }
        }
      },],
      backdropDismiss: false
    });
    alert.present();
  }

  ngOnInit() {

  }

}


