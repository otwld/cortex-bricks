import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgCdk } from './ng-cdk';

describe('NgCdk', () => {
  let component: NgCdk;
  let fixture: ComponentFixture<NgCdk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgCdk],
    }).compileComponents();

    fixture = TestBed.createComponent(NgCdk);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
