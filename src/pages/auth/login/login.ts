import { Component } from "@angular/core";

import {
  IonicPage,
  NavController,
  NavParams,
  MenuController,
  ModalController
} from "ionic-angular";

import { FormBuilder, FormGroup, Validators } from "@angular/forms";

import { Keyboard } from '@ionic-native/keyboard'

import { authTattoProvider } from "../../../providers/api/authTatto";
import { AlertProvider } from "../../../providers/alert";
import { Authjwt } from "../../../providers/authjwt";
import { StorageDB } from "../../../providers/storageDB";

@IonicPage()
@Component({
  selector: "page-login",
  templateUrl: "login.html"
})
export class LoginPage {
  email_validator = /^([\da-z_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;
  loginForm: FormGroup;
  loginUser = {};
  showMessage: number;
  message: string;
  hideFooter: boolean = false
  showLogin: boolean = false;
  showLogin2: boolean = true;
  constructor(
    public navctrl: NavController,
    public navParams: NavParams,
    public apiRest: authTattoProvider,
    public alertP: AlertProvider,
    public menuCtrl: MenuController,
    public modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private jwt: Authjwt,
    public keyboard: Keyboard,
    private dbStorage: StorageDB
  ) {
    this.menuCtrl.swipeEnable(false);
    this.loginForm = this.formBuilder.group({
      email: [
        "",
        Validators.compose([Validators.pattern(this.email_validator)])
      ],
      password: ["", Validators.required]
    });
  }

  goRegister() {
    this.navctrl.push("RegisterPage");
  }

  ionChange($event) {
    if (
      !this.loginForm.controls.email.valid &&
      this.loginForm.controls.email.dirty
    ) {
      this.showMessage = 1;
      this.message = "Por favor ingrese un correo electronico valido";
    } else {
      this.showMessage = 0;
    }
  }

  async ionViewDidLoad() {
    const token = await this.getToken();
    if (token != null) {
      const jwt = await this.jwt.authToken(token);
      if (jwt) {
        this.navctrl.setRoot("OrdersPage");
      }
    } else {
      this.showLogin = true
    }

    this.hiddenFooterKeyBoard()
  }

  async getToken() {
    return await this.dbStorage.getItem("token");
  }

  hiddenFooterKeyBoard() {
    this.keyboard.onKeyboardShow().subscribe(data => {
      this.hideFooter = true
    })

    this.keyboard.onKeyboardHide().subscribe(data => {
      this.hideFooter = false
    })

  }

  login() {
    this.apiRest
      .login(this.loginForm.value)
      .then(res => {
        console.log(JSON.stringify(res.data));
        if (res.data["code"] === 200) {
          if (!res.data["findUser"]["isactive"]) {
            this.alertP.showAlert(
              null,
              "Esta cuenta todavia no ha sido aceptada por favor intente mas tarde",
              "Cerrar"
            );
          } else {
            this.dbStorage.setItem("token", res["data"]["token"]);
            this.dbStorage.setItem('users', res['data']['findUser'])
            this.navctrl.setRoot("OrdersPage");
          }
        } else if(res.data["code"] === 400) {
          this.alertP.showAlert(
            null,
            "Correo y contraseña son incorrectos",
            "Cerrar"
          )
        }else if(res.data["code"] === 300){
          this.alertP.showAlert(
            null,
            "Esta cuenta no existe por favor verifique",
            "Cerrar"
          )
        }
      })
      .catch(e => {
        console.error(e);
      });
  }
  forgotPasword() {
    const modal = this.modalCtrl.create("ForgotPassword");
    modal.present();
  }
}
