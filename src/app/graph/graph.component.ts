import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  constructor(
    private renderer: Renderer2, 
    private el: ElementRef,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.initElements();

    this.dataService.getTradeData().subscribe(res => {
      console.log(res);
    });
  }

  initElements() {
    const div = this.renderer.createElement('div');
    this.renderer.addClass(div, "graph-container");

    const canvas = this.renderer.createElement('canvas');
    this.renderer.addClass(canvas, 'graph-canvas');

    this.renderer.appendChild(div, canvas);
    this.renderer.appendChild(this.el.nativeElement, div);
  }

}
