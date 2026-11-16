import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the email and password fields', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#senha')).toBeTruthy();
  });
});
