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
    this.drawCandlestick(tradeData.o, tradeData.c, tradeData.h, tradeData.l)
  }

  drawTimings(timings: number[]) {
    const intervals = (this.canvas.width / 800) * 10;
    const context = this.canvas.getContext('2d');
    const calculatedTimings = this.calculateTimings(timings);
    const timingHeight = 385;
    let shift = this.canvas.width / intervals;
    for (let count = 0, x = shift; count < calculatedTimings.length; count++, x += shift) {
      context.font="15px Georgia";
      context.fillText(calculatedTimings[count], x - context.measureText(calculatedTimings[count]).width/2, timingHeight);
    }
  }

  calculateTimings(timings: number[]): string[] {
    const formattedTimes: string[] = [];
    let intervals = (this.canvas.width / 800) * 10;
    for (let timing = timings.length; timing > 0 && intervals > 1; timing -= 9) {
      formattedTimes.unshift(this.getFormatedTime(timings[timing-1]));
      intervals--;
    }
    return formattedTimes;
  }

  getFormatedTime(time: number): string {
    const date = new Date(time * 1000);
    const hours = "0" + date.getHours();
    const minutes = "0" + date.getMinutes();
    return hours.substr(-2) + ':' + minutes.substr(-2);
  }

  drawCandlestick(buys: number[], sales: number[], maximums: number[], minimums: number[]) {
    const context = this.canvas.getContext('2d');
    const candleCount = (this.canvas.width / 800) * 70;
    const max = Math.max(...maximums.slice(maximums.length - candleCount));
    const min = Math.min(...minimums.slice(minimums.length - candleCount));
    const volatile = max - min;
    const bottomPadding = 30;
    const topPaddind = 10;
    const candleWidth = 8;
    //console.log('max: ', max, ', min: ', min, ', volatile: ', volatile, ', candleCount: ', candleCount)
    for (let count = 0, x = candleWidth; count < candleCount; count++, x += 10) {
      const buyValue = buys[buys.length - count - 1];
      const saleValue = sales[sales.length - count - 1];

      const xTopBody = Math.floor((this.canvas.width-1)/80)*80 - x + (candleWidth/2);
      const yTopBody = this.canvas.height - ((buyValue - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);
      const yBottomBody = this.canvas.height - ((saleValue - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);
      const height = yTopBody - yBottomBody;
      
      //console.log('xCoord1: ', xCoord1, ', yCoord1: ', yCoord1, ', buy: ', buyValue, ", sale: ", saleValue);
      const color = height > 0 ? "#008000" : "#ff3300";
      context.fillStyle = color;
      context.strokeStyle = color;

      const singleMax = maximums[maximums.length - count - 1];
      const singleMin = minimums[minimums.length - count - 1];
      const yMaxFitile = this.canvas.height - ((singleMax - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);
      const yMinFitile = this.canvas.height - ((singleMin - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);

      // if (height > 0) {
      //    const yTopBody = (this.canvas.height - bottomPadding - topPaddind) - ((maxAtCandleBody - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);
      //    const maxCandleValue = (this.canvas.height - bottomPadding - topPaddind) - ((singleMax - min)/volatile)*(this.canvas.height - bottomPadding - topPaddind);
      //    console.log('buyValue: ', buyValue, 'saleValue: ', saleValue, ', yTopBody: ', yTopBody, ', maxCandleValue', maxCandleValue , ', maxAtCandleBody: ', maxAtCandleBody, ', singleMax: ', singleMax);
      //    //console.log('xCoord1: ', xCoord1, ', yCoord1: ', yCoord1, ', buy: ', buyValue, ", sale: ", saleValue);
      //    context.beginPath();
      //    context.moveTo(xCoord1 + candleWidth/2, yCoord1);
      //    context.lineTo(xCoord1 + candleWidth/2, maxCandleValue);
      //    context.stroke();
      //   }

      console.log('buyValue: ', buyValue, ', saleValue: ', saleValue, ', singleMax: ', singleMax, ', singleMin', singleMin)
      context.beginPath();
      context.moveTo(xTopBody + candleWidth/2, yMaxFitile);
      context.lineTo(xTopBody + candleWidth/2, yMinFitile);
      context.stroke();

      context.fillRect(xTopBody, yTopBody, 8, Math.abs(height) < 1 ? 1 : height);
    }


    // const intervals = (this.canvas.width / 800) * 10;
    // let shift = this.canvas.width / intervals;
    // for (let count = 0, x = shift; count < intervals; count++, x += shift) {
    //   context.fillRect(x-4, 200, 8, 20);
    // }
    //context.fillRect(791, 150, 788, 150)
  }

}
