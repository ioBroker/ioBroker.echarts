/*! For license information please see src_Echarts_jsx.8973cad1.chunk.js.LICENSE.txt */
"use strict";(self.webpackChunkiobroker_echarts=self.webpackChunkiobroker_echarts||[]).push([["node_modules_babel_runtime_helpers_esm_objectSpread2_js-_efb90","node_modules_babel_runtime_helpers_esm_objectSpread2_js-_efb91","node_modules_babel_runtime_helpers_esm_objectSpread2_js-_efb92","node_modules_babel_runtime_helpers_esm_objectSpread2_js-_efb93","src_Echarts_jsx"],{7709:(e,t,a)=>{a.r(t),a.d(t,{default:()=>p});var s=a(9379),l=a(8437),r=a.n(l),o=a(5973),n=a.n(o),i=a(7085),d=a(1839),h=a(5636),u=a(579);const c=e=>{const[t,a]=(0,l.useState)(null);return(0,l.useEffect)((()=>{e.context.socket.getObjectViewSystem("chart","echarts.","echarts.\u9999").then((e=>{const t=[];e&&Object.values(e).forEach((e=>e._id&&!e._id.toString().endsWith(".")&&t.push(e._id)));const s=[];t.forEach((e=>{const t=e.split(".");if(t.length>=3){t.shift(),t.shift();const a=[];for(let e=0;e<t.length-1;e++){a.push(t[e]);const l=a.join(".");s.find((e=>e.path===l))||s.push({path:l,name:t[e],level:a.length})}a.push(t[t.length-1]),s.push({path:t.join("."),name:t[t.length-1],level:a.length,id:e})}})),s.sort(((e,t)=>e.path.localeCompare(t.path))),a(s)}))}),[]),t?(0,u.jsxs)(i.Select,{style:{width:"100%"},value:e.data[e.field.name]||"",onChange:t=>{const a=(0,s.A)((0,s.A)({},e.data),{},{[e.field.name]:t.target.value});e.setData(a)},renderValue:e=>e&&e.substring(10),variant:"standard",children:[(0,u.jsx)(i.MenuItem,{value:"",children:h.I18n.t("echarts_none")},"___none"),t.map((e=>(0,u.jsx)(i.MenuItem,{value:e.id||e.name,disabled:!e.id,children:(0,u.jsxs)("div",{style:{paddingLeft:20*e.level,display:"flex"},children:[(0,u.jsx)("span",{style:{paddingRight:4},children:e.id?(0,u.jsx)(d.Timeline,{}):(0,u.jsx)(h.IconClosed,{})}),e.name]})},e.name)))]}):null};class m extends window.visRxWidget{constructor(e){super(e),this.onReceiveMessage=e=>{var t;e&&"chartReady"===e.data&&(this.ready=!0,this.state.presetData&&(this.lastPresetData=JSON.stringify(this.state.presetData),null===(t=this.refIframe.contentWindow)||void 0===t||t.postMessage(this.lastPresetData,"*"),console.log("Received ready from iframe")))},this.refIframe=r().createRef(),this.ready=!1,this.state.presetData=null}static getWidgetInfo(){return{id:"tplEchartsChart",visSet:"echarts",visSetLabel:"set_label",visSetColor:"#aa314d",visWidgetLabel:"E-Charts",visName:"E-Charts",visAttrs:[{name:"common",fields:[{name:"noCard",label:"without_card",type:"checkbox",default:!1},{name:"widgetTitle",label:"name",hidden:"!!data.noCard"},{label:"noChartBackground",name:"noChartBackground",type:"checkbox",default:!0,hidden:e=>!e.noCard},{label:"echart_oid",name:"echart_oid",type:"custom",hidden:e=>!!e.history_instance||!!e.history_oid,component:(e,t,a,s)=>(0,u.jsx)(c,{field:e,data:t,setData:a,context:s.context,selectedWidgets:s.selectedWidgets,selectedView:s.selectedView})},{label:"history_instance",name:"history_instance",type:"instance",hidden:e=>!!e.echart_oid,adapter:"_dataSources"},{label:"history_oid",name:"history_oid",type:"id",hidden:e=>!!e.echart_oid||!e.history_instance,filter:e=>({common:{custom:e.history_instance}})},{label:"chartType",name:"chartType",default:"auto",hidden:e=>!e.history_oid,type:"select",options:[{value:"auto",label:"Auto"},{value:"line",label:"Line"},{value:"bar",label:"Bar"},{value:"scatterplot",label:"Scatter plot"},{value:"steps",label:"Steps"},{value:"stepsStart",label:"Steps on start"},{value:"spline",label:"Spline"}]},{label:"aggregate",name:"aggregate",default:"minmax",hidden:e=>!e.history_oid||"auto"===e.chartType||!e.chartType,type:"select",noTranslation:!0,options:["minmax","average","min","max","total","raw"]},{label:"live",name:"live",default:"30",type:"select",hidden:e=>!e.history_oid,options:[{value:"",label:"none"},{value:"5",label:"5 seconds"},{value:"10",label:"10 seconds"},{value:"15",label:"15 seconds"},{value:"20",label:"20 seconds"},{value:"30",label:"30 seconds"},{value:"60",label:"1 minute"},{value:"120",label:"2 minutes"},{value:"300",label:"5 minutes"},{value:"600",label:"10 minutes"},{value:"900",label:"15 minutes"},{value:"1200",label:"20 minutes"},{value:"1800",label:"30 minutes"},{value:"3600",label:"1 hour"},{value:"7200",label:"2 hours"},{value:"10800",label:"3 hours"},{value:"21600",label:"6 hours"},{value:"43200",label:"12 hours"},{value:"86400",label:"1 day"}]},{label:"aggregateType",name:"aggregateType",default:"step",hidden:e=>!e.history_oid,type:"select",options:[{label:"counts",value:"count"},{label:"seconds",value:"step"}]},{label:"aggregateSpan",name:"aggregateSpan",default:300,type:"number",hidden:e=>!e.history_oid},{label:"xticks",name:"xticks",default:"",type:"slider",min:0,max:50,hidden:e=>!e.history_oid},{label:"yticks",name:"yticks",default:"",type:"slider",min:0,max:50,hidden:e=>!e.history_oid},{label:"range",name:"range",default:"1440",hidden:e=>!e.history_oid,type:"select",options:[{value:"10",label:"10 minutes"},{value:"30",label:"30 minutes"},{value:"60",label:"1 hour"},{value:"120",label:"2 hours"},{value:"180",label:"3 hours"},{value:"360",label:"6 hours"},{value:"720",label:"12 hours"},{value:"1440",label:"1 day"},{value:"2880",label:"2 days"},{value:"4320",label:"3 days"},{value:"10080",label:"7 days"},{value:"20160",label:"14 days"},{value:"1m",label:"1 month"},{value:"2m",label:"2 months"},{value:"3m",label:"3 months"},{value:"6m",label:"6 months"},{value:"1y",label:"1 year"},{value:"2y",label:"2 years"}]},{label:"relativeEnd",name:"relativeEnd",default:"now",hidden:e=>!e.history_oid,type:"select",options:[{value:"now",label:"now"},{value:"1minute",label:"end of minute"},{value:"5minutes",label:"end of 5 minutes"},{value:"10minutes",label:"end of 10 minutes"},{value:"30minutes",label:"end of 30 minutes"},{value:"1hour",label:"end of hour"},{value:"2hours",label:"end of 2 hours"},{value:"3hours",label:"end of 3 hours"},{value:"4hours",label:"end of 4 hours"},{value:"6hours",label:"end of 6 hours"},{value:"8hours",label:"end of 8 hours"},{value:"12hours",label:"end of 12 hours"},{value:"today",label:"end of day"},{value:"weekEurope",label:"end of sunday"},{value:"weekUsa",label:"end of saturday"},{value:"month",label:"this month"},{value:"year",label:"this year"}]}]}],visDefaultStyle:{width:"100%",height:300,position:"relative"},visPrev:"widgets/echarts/img/prev_echarts.png"}}getWidgetInfo(){return m.getWidgetInfo()}static getDefaultLine(e,t,a,s){var l,r,o,n;const i="boolean"===(null===a||void 0===a||null===(l=a.common)||void 0===l?void 0:l.type),d={name:((null===a||void 0===a||null===(r=a.common)||void 0===r?void 0:r.name)&&h.Utils.getObjectNameFromObj(a,null,{language:s})||"").trim(),id:(null===a||void 0===a?void 0:a._id)||"",instance:t===e.common.defaultHistory?"":t||"",thickness:2,chartType:i?"steps":"line",aggregate:i?"onchange":"minmax",isBoolean:i,symbolSize:3,validTime:35};return null!==a&&void 0!==a&&null!==(o=a.common)&&void 0!==o&&o.color&&(d.color=a.common.color),null!==a&&void 0!==a&&null!==(n=a.common)&&void 0!==n&&n.unit&&(d.unit=a.common.unit),i&&(d.yaxe="off",d.min="0",d.yticks=1,d.fill=.3,d.symbolSize=1),d}loadChartParam(e,t){const a=this.state.rxData[e];return void 0===a||null===a?t:a}async propertiesUpdate(){this.state.rxData.history_oid&&this.state.rxData.history_instance?this.setState({presetData:await this.createChartFromLine()}):this.state.presetData&&this.setState({presetData:null})}async componentDidMount(){super.componentDidMount(),window.addEventListener("message",this.onReceiveMessage,!1),await this.propertiesUpdate()}componentWillUnmount(){window.removeEventListener("message",this.onReceiveMessage,!1)}onRxDataChanged(){this.propertiesUpdate()}async createChartFromLine(){this.systemConfig=this.systemConfig||await this.props.context.socket.getObject("system.config"),this.object&&this.object._id===this.state.rxData.history_oid||(this.object=await this.props.context.socket.getObject(this.state.rxData.history_oid));const e=[m.getDefaultLine(this.systemConfig,this.state.rxData.history_instance,this.object,h.I18n.getLanguage())];return e[0].xticks=this.loadChartParam("xticks",""),e[0].yticks=this.loadChartParam("yticks",""),{marks:[],lines:e,zoom:!0,hoverDetail:!0,aggregate:this.loadChartParam("aggregate","minmax"),chartType:this.loadChartParam("chartType","auto"),live:this.loadChartParam("live","30"),timeType:this.loadChartParam("timeType","relative"),aggregateType:this.loadChartParam("aggregateType","step"),aggregateSpan:this.loadChartParam("aggregateSpan","300"),ticks:this.loadChartParam("ticks",""),range:this.loadChartParam("range","1440"),relativeEnd:this.loadChartParam("relativeEnd","now"),start:this.loadChartParam("start",""),end:this.loadChartParam("end",""),start_time:this.loadChartParam("start_time",""),end_time:this.loadChartParam("end_time",""),noBorder:"noborder",noedit:!1,animation:0,legend:""}}renderWidgetBody(e){let t;if(super.renderWidgetBody(e),this.state.rxData.echart_oid&&"nothing_selected"!==this.state.rxData.echart_oid||this.state.presetData){const e=JSON.stringify(this.state.presetData);var a;if(this.ready&&this.lastPresetData!==e)this.lastPresetData=e,null===(a=this.refIframe.contentWindow)||void 0===a||a.postMessage(this.lastPresetData,"*");t=(0,u.jsx)("iframe",{ref:e=>this.refIframe=e,title:this.state.rxData.echart_oid||this.state.rxData.history_oid,style:{width:"100%",height:"100%",border:0},src:this.state.rxData.echart_oid?"../echarts/index.html?preset=".concat(this.state.rxData.echart_oid,"&noBG=").concat(this.state.rxData.noChartBackground||!this.state.rxData.noCard):"../echarts/index.html?noBG=".concat(this.state.rxData.noChartBackground||!this.state.rxData.noCard,"&edit=true")})}else t=(0,u.jsx)("div",{style:{padding:8,width:"calc(100% - 16px)",height:"calc(100% - 16px)",backgroundColor:this.state.rxData.noChartBackground?void 0:"dark"===this.props.context.themeType?"rgb(31, 31, 31)":"#f0f0f0"},children:h.I18n.t("echarts_chart_not_selected")});return this.state.rxData.noCard?t:this.wrapContent(t)}}m.propTypes={context:n().object,themeType:n().string,style:n().object,data:n().object};const p=m},1153:(e,t,a)=>{var s=a(8437),l=Symbol.for("react.element"),r=Symbol.for("react.fragment"),o=Object.prototype.hasOwnProperty,n=s.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,i={key:!0,ref:!0,__self:!0,__source:!0};function d(e,t,a){var s,r={},d=null,h=null;for(s in void 0!==a&&(d=""+a),void 0!==t.key&&(d=""+t.key),void 0!==t.ref&&(h=t.ref),t)o.call(t,s)&&!i.hasOwnProperty(s)&&(r[s]=t[s]);if(e&&e.defaultProps)for(s in t=e.defaultProps)void 0===r[s]&&(r[s]=t[s]);return{$$typeof:l,type:e,key:d,ref:h,props:r,_owner:n.current}}t.jsx=d,t.jsxs=d},579:(e,t,a)=>{e.exports=a(1153)},4467:(e,t,a)=>{a.d(t,{A:()=>l});var s=a(9526);function l(e,t,a){return(t=(0,s.A)(t))in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}},9379:(e,t,a)=>{a.d(t,{A:()=>r});var s=a(4467);function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);t&&(s=s.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,s)}return a}function r(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){(0,s.A)(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}},9526:(e,t,a)=>{function s(e){return s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s(e)}function l(e){var t=function(e,t){if("object"!=s(e)||!e)return e;var a=e[Symbol.toPrimitive];if(void 0!==a){var l=a.call(e,t||"default");if("object"!=s(l))return l;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)}(e,"string");return"symbol"==s(t)?t:t+""}a.d(t,{A:()=>l})}}]);
//# sourceMappingURL=src_Echarts_jsx.8973cad1.chunk.js.map