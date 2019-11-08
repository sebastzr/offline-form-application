import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from '../services/auth.service';
import { FormService } from '../services/form.service';
import { FormArray, FormBuilder } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-images',
  templateUrl: './images.page.html',
  styleUrls: ['./images.page.scss'],
})
export class ImagesPage implements OnInit {

  antForm: any;
  fotoForms: any;
  files: any;
  downloadURL: Observable<string>;
  loading: boolean = false;
  images: any;

  constructor(
    private afs: AngularFirestore,
    public auth: AuthService,
    private fb: FormBuilder,
    private form: FormService,
    private storage: AngularFireStorage,
    public alertController: AlertController
  ) { }

  ngOnInit() {
    this.antForm = this.form.antForm;
    this.fotoForms = this.form.fotoForms;
  }

  /**
   * Upload the images to firebase storage
   * @param event 

   */
  uploadPhoto(event:any) {
    const antValue = this.antForm.value;
    const file = event.target.files[0]; 
    const filePath = `formFotos/${antValue.solicitudEDP}/${new Date().getTime()}_${file.name}`;    
    const task = this.storage.upload(filePath, file);
    this.loading = true;
    task.snapshotChanges().pipe(
      finalize(() => this.getUrl(filePath))
      ).subscribe((url) => {        
      });
  }

  deletePhoto(i) {
    this.loading = true;
    const fileRef = this.storage.ref(this.antForm.value.fotos[i].path);
    fileRef.delete().subscribe(() => {
      this.antForm.value.fotos.splice(i, 1);
      this.afs.collection(this.antForm.controls.solicitudEDP.value).add(this.antForm.value);
      this.afs.collection('_forms').doc(this.antForm.controls.solicitudEDP.value).set(this.antForm.value);
      this.loading = false;
    });
  }

  /**
   * Get the url of the uploaded image
   * @param path 
   */
  getUrl(path) {
    const ref = this.storage.ref(path);
    this.downloadURL = ref.getDownloadURL();
    this.downloadURL.subscribe(url => {
      if (url) {
        this.antForm.controls.fotos.value.push({'url' : url, 'path' : path});
        this.afs.collection(this.antForm.controls.solicitudEDP.value).add(this.antForm.value);
        this.afs.collection('_forms').doc(this.antForm.controls.solicitudEDP.value).set(this.antForm.value);
        console.log(this.antForm.controls.fotos);
        console.log(this.antForm.value);
        this.loading = false;
      }
    });
  }

  async deleteAlert(i) {
    const alert = await this.alertController.create({
      header: 'Eliminar',      
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'  
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deletePhoto(i);
          }
        }
      ]
    });
    await alert.present();
  }
}
