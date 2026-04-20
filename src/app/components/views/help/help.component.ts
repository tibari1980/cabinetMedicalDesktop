import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html'
})
export class HelpComponent implements OnInit {
  activeTab: 'admin' | 'doctor' | 'secretary' = 'doctor';

  constructor(private location: Location) {}

  ngOnInit(): void {}

  goBack() {
    this.location.back();
  }

  setTab(tab: 'admin' | 'doctor' | 'secretary') {
    this.activeTab = tab;
  }
}
