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

    const topPaddind = 10;
    const bottomPadding = 30;
    const context = this.canvas.getContext('2d');
    const intervals = (this.canvas.width / 800) * 10;
    for (let x = 0; x <= this.canvas.width; x += this.canvas.width / intervals) {
      context.moveTo(x, 0 + topPaddind);
      context.lineTo(x, this.canvas.height - bottomPadding);
    }
    
    context.strokeStyle = "#e2e2e2";
    context.stroke();
  }

  // Событие вызывает перерисовку графика при динамическом изменении ширины окна
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
    this.drawCandlestick(tradeData.o, tradeData.c, tradeData.h, tradeData.l, tradeData.v);
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

  drawCandlestick(buys: number[], sales: number[], maximums: number[], minimums: number[], values: number[]) {
    const context = this.canvas.getContext('2d');

    // Высчитывааем сколько свечей поместится на канву
    const candleCount = (this.canvas.width / 800) * 70;

    // Получаем экстрэмумы значений продаж и покупок
    const max = Math.max(...[...maximums.slice(maximums.length - candleCount), ...buys.slice(buys.length - candleCount), ...sales.slice(sales.length - candleCount)]);
    const min = Math.min(...[...minimums.slice(minimums.length - candleCount), ...buys.slice(buys.length - candleCount), ...sales.slice(sales.length - candleCount)]);
    
    // Диапазон значений
    const volatile = max - min;

    // Экстрэмумы объема сделок
    const maxValue = Math.max(...values.slice(values.length - candleCount));
    const minValue = Math.min(...values.slice(values.length - candleCount));
    const interval = maxValue - minValue;

    const candleWidth = 8;
    const workArea = this.canvas.height;
    for (let count = 0, shift = candleWidth; count < candleCount; count++, shift += 10) {

      // Получаем значения на открытии и закрытии сделки
      const buyValue = buys[buys.length - count - 1];
      const saleValue = sales[sales.length - count - 1];

      // Верхняя левая точка тела свечи
      const xTopBody = Math.floor((this.canvas.width-1)/80)*80 - shift + (candleWidth/2);
      const yTopBody = workArea - ((buyValue - min)/volatile) *workArea;

      const yBottomBody = workArea - ((saleValue - min)/volatile) *workArea;
      const height = yTopBody - yBottomBody;
      
      const color = saleValue - buyValue > 0 ? "#008000" : "#ff3300";
      context.fillStyle = color;
      context.strokeStyle = color;

      // Значение объема сделок
      const value = values[values.length - count - 1];

      // Вычисляем экстрэмумы фителей
      const singleMax = maximums[maximums.length - count - 1];
      const singleMin = minimums[minimums.length - count - 1];

      // Вычисляем координаты фитилей
      const yMaxFitile = workArea - ((singleMax - min)/volatile)*workArea;
      const yMinFitile = workArea - ((singleMin - min)/volatile)*workArea;
      
      // Рисуем фитиль
      context.beginPath();
      context.moveTo(xTopBody + candleWidth/2, yMaxFitile);
      context.lineTo(xTopBody + candleWidth/2, yMinFitile);
      context.stroke();

      // Рисуем тело свечи
      context.fillRect(xTopBody, yTopBody, 8, Math.abs(height) < 1 ? 1 : height);

      // Устанавливаем прозрачность и отрисовываем объем
      context.globalAlpha = 0.5;
      this.drawValuesCount(value, candleWidth, candleCount, interval, shift);
      context.globalAlpha = 1;

      // console.log('buyValue: ', buyValue, ', saleValue: ', saleValue, ', singleMax: ', singleMax, ', singleMin', singleMin)
    }
  }

  // Отрисовка объема сделок
  drawValuesCount(value: number, candleWidth: number, candleCount: number, interval: number, shift: number) {
    const context = this.canvas.getContext('2d');

    // Для отображения объема сделок отводим 60 пикс
    const valuesHeigh = 60;

    // Вычисляем верхнююлевую точку
    const xTopValue = Math.floor((this.canvas.width-1)/80)*80 + (candleWidth/2) - shift;
    const yTopValue = 370 - (value/interval)*valuesHeigh;

    context.fillRect(xTopValue, yTopValue, 8, 370 - yTopValue);
  
  }
}
