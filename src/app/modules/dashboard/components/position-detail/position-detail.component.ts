import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BehaviorSubject, Observable } from 'rxjs';
import { PositionsService } from '../../services/positions.service';
import { Position } from '../../models/position';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatSort, MatTable, ErrorStateMatcher } from '@angular/material';
import { Candidat } from '../../models/candidat';
import { Test } from '../../models/test';
import { Reviewer } from '../../models/reviever';
import { BigPictureComponent } from "../big-picture/big-picture.component";
import { TestService } from '../../services/test.service';
import { CandidatService } from '../../services/candidat.service';
import { ViewerService } from '../../services/viewer.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-position-detail',
  templateUrl: './position-detail.component.html',
  styleUrls: ['./position-detail.component.css']
})
export class PositionDetailComponent implements OnInit {

  isLinear = true;
  revievierFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  firstFormGroup: FormGroup;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  public position: Position;

  public candidateDatabase: Array<Candidat> = new Array<Candidat>();
  displayedColumns: string[] = ['name', 'email', 'phone', '_'];
  dataSourceCandidats: MatTableDataSource<Candidat>;

  public viewerDatabase: Array<Reviewer> = new Array<Reviewer>();
  displayedColumnsR: string[] = ['number', 'name', 'email', '_'];
  dataSourceViewers: MatTableDataSource<Reviewer>;

  public questions: Array<Test> = []

  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  public loader: boolean = true;
  matcher = new MyErrorStateMatcher();



  constructor(private activatedRoute: ActivatedRoute, private router: Router, private _formBuilder: FormBuilder,
    private positionService: PositionsService,
    private testService: TestService,
    private viewerService: ViewerService,
    private candidatService: CandidatService
  ) { }

  ngOnInit() {

    this.firstFormGroup = this._formBuilder.group({
      number: ['', Validators.required],
      name: ['', Validators.required],
      companyInfo: [''],
      instruction: [''],
      openDate: [''],
      closeDate: [''],
      about: [''],
    });
    this.secondFormGroup = this._formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      invitationDate: [''],
      expiredDate: [''],
      phone: ['']
    });
    this.revievierFormGroup = this._formBuilder.group({
      id: [''],
      name: ['', Validators.required],
      email: ['', Validators.required],
      revieversInvitationDatepicker: [''],
      number: ['']
    });

    this.activatedRoute.params.subscribe(params => {
      var positionId = params['id'];
      if (positionId !== undefined) {

        console.log('positionId', positionId);

        this.loadPosition(positionId)

      }
    });
  }

  loadPosition(id: number) {

    this.showLoader();
    this.positionService.getPositionDetail(id).subscribe(position => {
      this.hideLoader();

      this.position = position;

      if (position.viewers !== null) {
        this.viewerDatabase = position.viewers;
      }

      if (position.candidats !== null) {
        this.candidateDatabase = position.candidats;
      }

      if (position.tests !== null) {
        this.questions = position.tests;
      }

      this.loadPositionCommonDetail();

      this.dataSourceCandidats = new MatTableDataSource<Candidat>(this.candidateDatabase)
      this.dataSourceCandidats.paginator = this.paginator;
      this.dataSourceCandidats.sort = this.sort;

      this.dataSourceViewers = new MatTableDataSource<Reviewer>(this.viewerDatabase)
      this.dataSourceViewers.paginator = this.paginator;
      this.dataSourceViewers.sort = this.sort;

      console.log(position)

    }, (error) => {
      this.hideLoader();
      //this.errorMessageOn(error.message)
      //console.log('error.message');
      return Observable.throw(new Error(error.status));
    });
  }

  loadPositionCommonDetail() {

   // this.firstFormGroup.patchValue(this.position); 
    
    this.firstFormGroup.setValue({ 
      openDate: this.toDateTime(this.position.openDate),
      name: this.position.name,
      number: this.position.number,
      companyInfo: this.position.companyInfo,
      instruction: this.position.instruction,
      about: this.position.about,
      closeDate: this.toDateTime(this.position.closeDate)  
    });

  }

  updateCommonInfo(){

    this.position.about = this.firstFormGroup.value.about
    this.position.companyInfo = this.firstFormGroup.value.companyInfo
    this.position.name = this.firstFormGroup.value.name
    this.position.instruction = this.firstFormGroup.value.instruction
    this.position.number = this.firstFormGroup.value.number
    this.position.openDate =  this.getSeconds(this.firstFormGroup.value.openDate)
    this.position.closeDate = this.getSeconds(this.firstFormGroup.value.closeDate)

    JSON.stringify(this.position);
    this.showLoader();
    this.positionService.updatePosition(JSON.stringify(this.position)).subscribe(_ => {
      this.hideLoader();
    });
  }

  goBack() {
    this.router.navigate(['../../dashboard'], { relativeTo: this.activatedRoute });
  }

  applyFilter(filterValue: string) {
    this.dataSourceCandidats.filter = filterValue.trim()
  }

  candidatDetail() {
    this.router.navigate(['../candidat-detail'], { relativeTo: this.activatedRoute });
  }

  addCandidat() {
    this.showLoader();
    console.log('Calling add')
    var candidat = new Candidat()
    candidat.email = this.secondFormGroup.value.email;
    candidat.name = this.secondFormGroup.value.name;
    candidat.phone = this.secondFormGroup.value.phone;
    candidat.expiredDate = this.getSeconds(this.secondFormGroup.value.expiredDate);
    candidat.invitationDate = this.getSeconds(this.secondFormGroup.value.invitationDate);
    candidat.positionId = this.position.id;

    console.log(candidat)
    //this.database.push(candidat);

    this.candidatService.addCandidat(JSON.stringify(candidat)).subscribe(_ => {
      this.hideLoader();
    }, (error) => {
      this.hideLoader();
      //this.errorMessageOn(error.message)
      //console.log('error.message');
      return Observable.throw(new Error(error.status));
    });

    this.dataSourceCandidats.data.push(candidat);
    this.dataSourceCandidats.data = this.dataSourceCandidats.data.slice();
    console.log(this.dataSourceCandidats.data);
    this.table.renderRows();

  }

  deleteCandidat(candidat: Candidat) {
    var index = this.dataSourceCandidats.data.indexOf(candidat);
    if (index > -1) {
      this.dataSourceCandidats.data.splice(index, 1);
    }
    this.dataSourceCandidats.data = this.dataSourceCandidats.data.slice();
    this.table.renderRows();
    console.log(this.dataSourceCandidats.data);
  }

  addQuestions(question: string, time: string) {

    var test = new Test();
    test.name = question;
    test.time = 60 * (Number.parseInt(time));
    test.id = 0;
    this.questions.push(test);
    console.log(test);

    this.showLoader();
    this.testService.addTest(JSON.stringify(test)).subscribe(_ => {
      this.hideLoader();
    }, (error) => {
      this.hideLoader();
      //this.errorMessageOn(error.message)
      //console.log('error.message');
      return Observable.throw(new Error(error.status));
    });
  }



  addReviever() {
    console.log('Calling add')
    var reviev = new Reviewer();
    reviev.name = this.revievierFormGroup.value.name;
    reviev.email = this.revievierFormGroup.value.email;
    reviev.number = this.revievierFormGroup.value.number;
    reviev.invitationDate = this.getSeconds(this.revievierFormGroup.value.revieversInvitationDatepicker);
    reviev.positionId = this.position.id;

    this.showLoader();
    this.viewerService.addViewer(JSON.stringify(reviev)).subscribe(_ => {
      this.hideLoader();
    }, (error) => {
      this.hideLoader();
      //this.errorMessageOn(error.message)
      //console.log('error.message');
      return Observable.throw(new Error(error.status));
    });


    this.dataSourceViewers.data.push(reviev);
    this.dataSourceViewers.data = this.dataSourceViewers.data.slice();
    console.log(this.dataSourceViewers.data);
    this.table.renderRows();
    //his.candidatTable.renderRows();
  }

  deleteReviever(reviever: Reviewer) {
    var index = this.dataSourceViewers.data.indexOf(reviever);
    if (index > -1) {
      this.dataSourceViewers.data.splice(index, 1);
    }
    this.dataSourceViewers.data = this.dataSourceViewers.data.slice();
    this.table.renderRows();
    console.log(this.dataSourceViewers.data);
  }



  getSeconds(date: Date): number {
    var seconds = new Date().getTime() / 1000;
    return seconds;
  }

  toDateTime(seconds: number) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(seconds);
    return t;
  }

  private showLoader() {
    this.loader = false;
  }

  private hideLoader() {
    this.loader = true;
  }

}
