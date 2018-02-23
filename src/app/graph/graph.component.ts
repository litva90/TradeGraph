import { Component, OnInit, Renderer2, ElementRef, HostListener } from '@angular/core';
import { DataService } from '../data.service';
import { Trade } from '../../models/trade';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  canvas: HTMLCanvasElement;
  tradeData: Trade;

  constructor(
    private renderer: Renderer2, 
    private el: ElementRef,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.initElements();
    this.drawGrid();

    this.dataService.getTradeData().subscribe(trade => {
      this.tradeData = trade;
      this.drawTradeData(trade);
    });
  }

  initElements() {
    const div = this.renderer.createElement('div');
    this.renderer.addClass(div, "graph-container");

    this.canvas = this.renderer.createElement('canvas');
    this.canvas.width = this.getCanvasWidth();
    this.canvas.height = 400;
    this.renderer.addClass(this.canvas, 'graph-canvas');

    this.renderer.appendChild(div, this.canvas);
    this.renderer.appendChild(this.el.nativeElement, div);
  }

  drawGrid() {
    if (!this.canvas) return;

    const bottomPadding = 30;
    const topPaddind = 10;
    const context = this.canvas.getContext('2d');
    const intervals = (this.canvas.width / 800) * 10;
    for (let x = 0; x <= this.canvas.width; x += this.canvas.width / intervals) {
      context.moveTo(x, 0 + topPaddind);
      context.lineTo(x, this.canvas.height - bottomPadding);
    }
    
    context.strokeStyle = "#e2e2e2";
    context.stroke();
  }

  @HostListener('window:resize', ['$event'])
  onResize(e) {
    this.resizeCanvas();
    this.drawGrid();
    this.drawTradeData(this.tradeData);
  }

  resizeCanvas() {
    this.canvas.width = this.getCanvasWidth();
  }

  getCanvasWidth(): number {
    return document.documentElement.clientWidth < 800 ?
    document.documentElement.clientWidth - 10 : 800;
  }

  drawTradeData(tradeData: Trade) {
    this.drawTimings(tradeData.t);
  }

  drawTimings(timings: number[]) {
    let intervals = (this.canvas.width / 800) * 10;
    const context = this.canvas.getContext('2d');
    const calculatedTimings = this.calculateTimings(timings);
    let shift = this.canvas.width / intervals;
    for (let count = 0, x = shift; count < calculatedTimings.length; count++, x += shift) {
      context.font="15px Georgia";
      context.fillText(calculatedTimings[count], x - context.measureText(calculatedTimings[count]).width/2, 385);
    }
  }

  calculateTimings(timings: number[]): string[] {
    let formattedTimes: string[] = [];
    let intervals = (this.canvas.width / 800) * 10;
    for (let timing = timings.length; timing > 0 && intervals > 1; timing -= 9) {
      formattedTimes.unshift(this.getFormatedTime(timings[timing-1]));
      intervals--;
    }
    return formattedTimes;
  }

  getFormatedTime(time: number): string {
    let date = new Date(time * 1000);
    let hours = "0" + date.getHours();
    let minutes = "0" + date.getMinutes();
    return hours.substr(-2) + ':' + minutes.substr(-2);
  }

  drawTimeToCanvas() {

  }
}
