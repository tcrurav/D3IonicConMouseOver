import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { UserServiceProvider } from '../../providers/user-service/user-service';

import * as d3 from 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Shape from "d3-shape";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Format from "d3-format";


export interface Stock {
  date: Date,
  value: number
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  title: string = 'D3.js with Ionic 2!';
  subtitle: string = 'Line Chart';

  margin = {top: 20, right: 20, bottom: 30, left: 50};
  width: number;
  height: number;
  x: any;
  y: any;
  svg: any;
  miSvg: any;
  line: d3Shape.Line<[number, number]>;
  opcion: string = "resistencia";
  color: "#FF0000";
  resistencia: number = 0;
  soporte: number = 0;
  focus: any;

  StatsLineChart: Stock[] = [];

  constructor(public navCtrl: NavController, public datosProvider: UserServiceProvider) {
    this.width = 450 - this.margin.left - this.margin.right ;
    this.height = 250 - this.margin.top - this.margin.bottom;
  }

  ionViewDidLoad() {
    this.obtenerDatos(this.datosProvider);
  }

  obtenerDatos = (data) => {
    let datosGrafica
    data.getGrafica().subscribe((datos)=>{
      datosGrafica = datos.json();
      this.recorrerDatos(datosGrafica);
    })
  }

  recorrerDatos = (data) =>{
    data.dataset.data.map((data)=>{
      this.StatsLineChart.push(
        {date:  new Date(data[0]), value: data[4]}
      ) 
    })
    this.crearGrafica();
  }

  crearGrafica(){
    this.initSvg()
    this.initAxis();
    this.drawAxis();
    this.drawLine();
    this.eventCapture();
    this.showData();
  }

  initSvg() {
    this.miSvg = d3.select("#lineChart")
      .append("svg")
      .attr("width", '100%')
      .attr("height", '100%')
      .attr('viewBox','0 0 450 250');

    this.svg = this.miSvg
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  initAxis() {    
    this.x = d3Scale.scaleTime().range([0, this.width]);
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    this.x.domain(d3Array.extent(this.StatsLineChart, (d) => d.date ));
    this.y.domain(d3Array.extent(this.StatsLineChart, (d) => d.value ));
  }

  eventCapture(){
    var self = this;
    this.miSvg.on("click", function() {
      var coords = d3.mouse(this);
      var newHeight = coords[1];
      console.log("newHeight");
      var newScaledHeight = self.y.invert(newHeight - self.margin.top);
      self.moveLine(newScaledHeight);
    });
  }  

  moveLine(newHeight){
    var oldLine = d3.select("#" + this.opcion);
    switch(this.opcion){
      case "resistencia":
        if(this.soporte != 0 && newHeight < this.resistencia){
          return;
        } else {          
          this.soporte = newHeight;          
        }
        break;        
      case "soporte":
        if(this.resistencia != 0 && newHeight > this.soporte){
          return;
        } else {
          this.resistencia = newHeight;
        }
        break;
    }
    console.log("tschüss");
    if(oldLine != null){
      oldLine.remove();
    }
    this.drawLineWithHeight(newHeight);
  }

  drawAxis() {
    this.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3Axis.axisBottom(this.x));

    this.svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3Axis.axisLeft(this.y))
        .append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Price ($)");
  }

  drawLine() {
    this.line = d3Shape.line()
        .x( (d: any) => this.x(d.date) )
        .y( (d: any) => this.y(d.value) );

    this.svg.append("path")
        .datum(this.StatsLineChart)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", this.line);
  }

  drawLineWithHeight(height) {
    this.line = d3Shape.line()
        .x( (d: any) => this.x(d.date) )
        .y( (d: any) => this.y(height) );

    this.svg.append("path")
        .datum(this.StatsLineChart)
        .attr("id", this.opcion)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", this.line);
  }

  showData(){
    this.focus = this.svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

    this.focus.append("circle")
        .attr("r", 4.5);

    this.focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    let self = this;
    this.svg.append("rect")
        .attr("class", "overlay")
        .attr("width", this.width)
        .attr("height", this.height)
        .on("mouseover", () => this.focus.style("display", null))
        .on("mouseout", () => this.focus.style("display", "none"))
        .on("mousemove", function() {
          var coords = d3.mouse(this);
          var newX = self.x.invert(coords[0]);
          self.mousemove(self, newX);
        });

    d3.select('.overlay')
        .style('fill', 'none')
        .style('pointer-events', 'all');
  }

  mousemove(self, newX) {
    let bisectDate = d3Array.bisector( (d: any) => d.date ).left;
    let formatValue = d3Format.format(",.2f");
    let formatCurrency = function(d) { return "$" + formatValue(d); };

    console.log(self.StatsLineChart);
    console.log(newX);
    let x0 = newX;
    console.log("llegó 2");
    let i = bisectDate(self.StatsLineChart.reverse(), x0, 1);
    console.log(i);
    let d0 = self.StatsLineChart[i - 1];
    console.log("llegó 4");
    let d1 = self.StatsLineChart[i];
    console.log("llegó 5");

    console.log(d0);
    console.log(d1);

    var d;
    if(d0 && d1){
      d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    } else if(d0) {
      d = d0;
    } else if(d1){
      d = d1;
    } else {
      return;
    }
    
    self.focus.attr("transform", "translate(" + self.x(d.date) + "," + self.y(d.value) + ")");
    self.focus.select("text").text(formatCurrency(d.value));
  }
}
