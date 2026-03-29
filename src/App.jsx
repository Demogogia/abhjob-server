import React, { useState, useEffect, useRef, useMemo, Component } from "react";
import { api } from "./api";
import {
  Bike, Truck, Monitor, Camera, Code2, Wrench,
  PartyPopper, Palette, Bot, Smartphone, Scissors, Scale, Car, GraduationCap,
  User, Search, ClipboardList, FileText, HelpCircle, LogOut, Menu, X,
  Phone, Shield, CheckCircle, Building2, AlertCircle,
  Eye, EyeOff, ArrowLeft, Star, MapPin, Clock, ImagePlus, Check,
  ChevronDown, ChevronUp, Download, Users, Lock, Hammer, Palmtree, Share2, Heart
} from "lucide-react";

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
export class ErrorBoundary extends Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  render(){
    if(this.state.error){
      return(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",gap:16,padding:24,fontFamily:"Nunito,sans-serif"}}>
          <div style={{fontSize:48}}>⚠️</div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#111827"}}>Что-то пошло не так</h2>
          <p style={{margin:0,color:"#6b7280",textAlign:"center"}}>Попробуйте обновить страницу</p>
          <button onClick={()=>window.location.reload()}
            style={{padding:"10px 24px",background:"#2563eb",color:"#fff",border:"none",
              borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
            Обновить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Генератор уникальных ID
const uid=()=>crypto.randomUUID();

// Сжатие фото до ~200 КБ
function compressImage(file,maxSizeKb=200,maxDim=800){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=ev=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        let {width:w,height:h}=img;
        if(w>maxDim||h>maxDim){
          if(w>h){h=Math.round(h*maxDim/w);w=maxDim;}
          else{w=Math.round(w*maxDim/h);h=maxDim;}
        }
        const canvas=document.createElement("canvas");
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        let q=0.85;
        const tryCompress=()=>{
          const data=canvas.toDataURL("image/jpeg",q);
          const sizeKb=(data.length*3/4)/1024;
          if(sizeKb<=maxSizeKb||q<=0.3){resolve(data);}
          else{q-=0.1;tryCompress();}
        };
        tryCompress();
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Веник и совок
function BroomIcon({size=24, color="currentColor", strokeWidth=1.8}){
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* Ручка веника */}
      <line x1="16" y1="2" x2="8" y2="14"/>
      {/* Пучок щетины */}
      <line x1="8" y1="14" x2="5" y2="17"/>
      <line x1="8" y1="14" x2="7" y2="18"/>
      <line x1="8" y1="14" x2="9" y2="18"/>
      <line x1="8" y1="14" x2="11" y2="17"/>
      {/* Совок — корпус */}
      <path d="M3 18 Q3 22 8 22 L13 22 L14 18 Z"/>
      {/* Совок — ручка */}
      <line x1="13" y1="20" x2="21" y2="20"/>
    </svg>
  );
}

// Inject Nunito font
// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useIsMobile(bp=1024){
  const [mobile,setMobile]=useState(()=>window.innerWidth<bp);
  useEffect(()=>{
    const fn=()=>setMobile(window.innerWidth<bp);
    window.addEventListener("resize",fn);
    return()=>window.removeEventListener("resize",fn);
  },[bp]);
  return mobile;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BRAND = { primary:"#111827", accent:"#2563eb", light:"#eff6ff" };

const CATEGORIES = [
  {label:"Курьерские услуги",                  Icon:Bike},
  {label:"Ремонт и строительство",             Icon:Hammer},
  {label:"Грузоперевозки",                     Icon:Truck},
  {label:"Уборка и помощь по хозяйству",       Icon:BroomIcon},
  {label:"Компьютерная помощь",                Icon:Monitor},
  {label:"Фото, видео и аудио",                Icon:Camera},
  {label:"Разработка ПО",                      Icon:Code2},
  {label:"Установка и ремонт техники",         Icon:Wrench},
  {label:"Мероприятия и промоакции",           Icon:PartyPopper},
  {label:"Дизайн",                             Icon:Palette},
  {label:"Виртуальный помощник",               Icon:Bot},
  {label:"Ремонт цифровой техники",            Icon:Smartphone},
  {label:"Красота и здоровье",                 Icon:Scissors},
  {label:"Юридическая и бухгалтерская помощь", Icon:Scale},
  {label:"Ремонт транспорта",                  Icon:Car},
  {label:"Репетиторы и обучение",              Icon:GraduationCap},
  {label:"Туризм и экскурсии",                 Icon:Palmtree},
];

const ABKHAZIA_CITIES = [
  "Гагра","Пицунда","Новый Афон","Гудаута","Сухум",
  "Очамчира","Ткуарчал","Гал","По всей Абхазии",
];

// Simple profanity filter — add words as needed
const BAD_WORDS = ["хуй","пизда","блядь","ебать","сука","пидор","мудак","залупа","хер","ёбаный"];
function hasBadWords(str){ return BAD_WORDS.some(w=>(str||"").toLowerCase().includes(w)); }
function checkText(...fields){ return fields.some(f=>hasBadWords(f)); }

const INITIAL_WORKERS = [
  { id:1, name:"Аслан Квициния", gender:"м", category:"Ремонт и строительство",
    profession:"Каменщик, кладка и отделка", experience:"12 лет", city:"Сухум", age:42,
    salary:"90 000 ₽", salaryNum:90000, travelCities:["По всей Абхазии"],
    skills:"Кирпичная кладка, штукатурка, бетон, фасады",
    about:"Работаю аккуратно и в срок. Бригада из 3 человек. Опыт в строительстве домов под ключ.",
    phone:"+7 940 111-22-33", email:"", postedBy:101,
    photo:"data:image/jpeg;base64,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", verified:true, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Кладка кирпича (1 м²)",from:1200,to:2500,negotiable:false},
      {id:2,name:"Штукатурка стен (1 м²)",from:400,to:800,negotiable:false},
      {id:3,name:"Фундамент под ключ",from:null,to:null,negotiable:true},
    ]},
  { id:2, name:"Даур Аргун", gender:"м", category:"Ремонт транспорта",
    profession:"Автомеханик, диагностика и ремонт", experience:"9 лет", city:"Сухум", age:36,
    salary:"70 000 ₽", salaryNum:70000, travelCities:["Сухум","Гудаута","Новый Афон"],
    skills:"Ходовая, двигатель, электрика авто, диагностика",
    about:"Собственный бокс в Сухуме. Работаю с любыми марками. Качество гарантирую.",
    phone:"+7 940 222-33-44", email:"", postedBy:102,
    photo:null, verified:false, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Замена масла и фильтров",from:1500,to:null,negotiable:false},
      {id:2,name:"Диагностика ходовой",from:500,to:null,negotiable:false},
      {id:3,name:"Ремонт двигателя (ДВС)",from:15000,to:90000,negotiable:false},
      {id:4,name:"Кузовной ремонт",from:null,to:null,negotiable:true},
    ]},
  { id:3, name:"Нателла Гамисония", gender:"ж", category:"Красота и здоровье",
    profession:"Мастер маникюра и педикюра", experience:"5 лет", city:"Гагра", age:28,
    salary:"2 000 ₽/услуга", salaryNum:2000, travelCities:["Гагра","Пицунда"],
    skills:"Маникюр, педикюр, наращивание, покрытие гель-лак",
    about:"Выезжаю на дом. Работаю качественными материалами.",
    phone:"+7 940 333-55-66", email:"natella@mail.ru", postedBy:103,
    photo:null, verified:true, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Маникюр классический",from:800,to:1200,negotiable:false},
      {id:2,name:"Покрытие гель-лак",from:1500,to:2000,negotiable:false},
      {id:3,name:"Педикюр",from:1200,to:1800,negotiable:false},
      {id:4,name:"Наращивание ногтей",from:2500,to:null,negotiable:false},
    ]},
  { id:4, name:"Зураб Шинкуба", gender:"м", category:"Грузоперевозки",
    profession:"Водитель грузовика, переезды", experience:"14 лет", city:"Сухум", age:45,
    salary:"80 000 ₽", salaryNum:80000, travelCities:["По всей Абхазии"],
    skills:"Категории B, C, E. Газель и фура", about:"",
    phone:"+7 940 444-66-77", email:"", postedBy:104,
    photo:null, verified:false, approved:true, photoApproved:false,
    services:[
      {id:1,name:"Переезд по городу (Газель)",from:2000,to:5000,negotiable:false},
      {id:2,name:"Межгород (за 1 км)",from:40,to:null,negotiable:false},
      {id:3,name:"Вывоз мусора",from:1500,to:null,negotiable:false},
    ]},
  { id:5, name:"Мадина Хагба", gender:"ж", category:"Уборка и помощь по хозяйству",
    profession:"Уборщица, помощница по хозяйству", experience:"6 лет", city:"Гагра", age:34,
    salary:"1 500 ₽/день", salaryNum:1500, travelCities:["Гагра","Пицунда","Новый Афон"],
    skills:"Генеральная уборка, глажка, готовка, уход за детьми",
    about:"Аккуратная, ответственная. Имею рекомендации от предыдущих работодателей.",
    phone:"+7 940 555-77-88", email:"", postedBy:105,
    photo:null, verified:false, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Уборка квартиры (1 день)",from:1500,to:2500,negotiable:false},
      {id:2,name:"Генеральная уборка",from:3000,to:6000,negotiable:false},
      {id:3,name:"Готовка на день",from:1000,to:1500,negotiable:false},
    ]},
  { id:6, name:"Беслан Лакоба", gender:"м", category:"Установка и ремонт техники",
    profession:"Монтаж кондиционеров и сплит-систем", experience:"7 лет", city:"Сухум", age:33,
    salary:"85 000 ₽", salaryNum:85000, travelCities:["По всей Абхазии"],
    skills:"Монтаж, заправка фреоном, диагностика, обслуживание",
    about:"Сертифицированный мастер. Гарантия на работу 1 год.",
    phone:"+7 940 666-88-99", email:"", postedBy:106,
    photo:null, verified:true, approved:true, photoApproved:false,
    services:[
      {id:1,name:"Монтаж сплит-системы",from:3000,to:5000,negotiable:false},
      {id:2,name:"Заправка фреоном",from:2000,to:null,negotiable:false},
      {id:3,name:"Диагностика и чистка",from:1500,to:3000,negotiable:false},
    ]},
  { id:7, name:"Амра Цвижба", gender:"ж", category:"Репетиторы и обучение",
    profession:"Репетитор по математике и русскому языку", experience:"10 лет", city:"Сухум", age:38,
    salary:"1 200 ₽/ч", salaryNum:1200, travelCities:["Сухум","Гудаута"],
    skills:"ЕГЭ, ОГЭ, начальная школа, подготовка к поступлению",
    about:"Педагог с дипломом. Индивидуальный подход к каждому ученику. Онлайн и офлайн.",
    phone:"+7 940 777-99-00", email:"amra@mail.ru", postedBy:107,
    photo:null, verified:false, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Урок математики (1 ч)",from:1200,to:null,negotiable:false},
      {id:2,name:"Урок русского языка (1 ч)",from:1000,to:null,negotiable:false},
      {id:3,name:"Подготовка к ЕГЭ (курс)",from:15000,to:25000,negotiable:false},
    ]},
  { id:8, name:"Темур Анкваб", gender:"м", category:"Компьютерная помощь",
    profession:"Компьютерный мастер, ремонт ноутбуков и ПК", experience:"8 лет", city:"Сухум", age:31,
    salary:"от 1 000 ₽", salaryNum:1000, travelCities:["Сухум","Очамчира"],
    skills:"Ремонт, настройка, вирусы, Windows, сети, видеонаблюдение",
    about:"Выезжаю на дом и в офис. Быстро и недорого.",
    phone:"+7 940 888-00-11", email:"", postedBy:108,
    photo:null, verified:false, approved:true, photoApproved:false,
    services:[
      {id:1,name:"Чистка и профилактика ПК",from:1000,to:2000,negotiable:false},
      {id:2,name:"Удаление вирусов",from:1000,to:null,negotiable:false},
      {id:3,name:"Установка Windows",from:1500,to:null,negotiable:false},
      {id:4,name:"Ремонт ноутбука",from:2000,to:8000,negotiable:false},
    ]},
  { id:9, name:"Лейла Тарнава", gender:"ж", category:"Фото, видео и аудио",
    profession:"Фотограф, съёмка мероприятий и портретов", experience:"4 года", city:"Гагра", age:26,
    salary:"от 5 000 ₽/съёмка", salaryNum:5000, travelCities:["Гагра","Пицунда","Новый Афон","Сухум"],
    skills:"Свадьбы, мероприятия, портреты, предметная съёмка, ретушь",
    about:"Обработка фотографий в течение 5 рабочих дней. Портфолио по запросу.",
    phone:"+7 940 999-11-22", email:"leila.photo@mail.ru", postedBy:109,
    photo:null, verified:false, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Фотосессия (1 ч)",from:5000,to:8000,negotiable:false},
      {id:2,name:"Свадебная съёмка (день)",from:25000,to:50000,negotiable:false},
      {id:3,name:"Корпоратив / мероприятие",from:null,to:null,negotiable:true},
    ]},
  { id:10, name:"Адгур Барциц", gender:"м", category:"Юридическая и бухгалтерская помощь",
    profession:"Юрист, консультации и составление документов", experience:"11 лет", city:"Сухум", age:44,
    salary:"от 2 000 ₽/консультация", salaryNum:2000, travelCities:["Сухум"],
    skills:"Гражданское право, договоры, недвижимость, наследство, споры",
    about:"Практикующий юрист. Консультирую очно и онлайн.",
    phone:"+7 940 100-22-33", email:"adgur.law@mail.ru", postedBy:110,
    photo:null, verified:true, approved:true, photoApproved:true,
    services:[
      {id:1,name:"Юридическая консультация",from:2000,to:null,negotiable:false},
      {id:2,name:"Составление договора",from:3000,to:8000,negotiable:false},
      {id:3,name:"Сопровождение сделки",from:null,to:null,negotiable:true},
    ]},
];


const COLORS = ["#2563eb","#16a34a","#dc2626","#9333ea","#ea580c","#0891b2","#be185d","#b45309"];

const FAQ_ITEMS = [
  { q:"Как найти нужного специалиста?",
    a:[
      "Перейдите в раздел ",
      {text:"«Специалисты»",key:"catalog"},
      " и введите в строку поиска профессию, навык или город. Например: «сварщик», «маникюр», «Сухум»."
    ]},
  { q:"Как разместить анкету?",
    a:[
      "Нажмите ",
      {text:"«Разместить анкету»",key:"postWorker"},
      " в меню — вы попадёте на форму. Анкета появится в каталоге после проверки администратором."
    ]},
  { q:"Как связаться с работником?",
    a:[
      "Нажмите кнопку «Связаться» на карточке в разделе ",
      {text:"«Специалисты»",key:"catalog"},
      ". Контакт происходит через платформу AbhJob — так мы гарантируем безопасность обеих сторон."
    ]},
  { q:"Что значит значок «Проверен»?",
    a:[
      "Работник лично посетил офис AbhJob и предоставил документы. Мы подтвердили его личность и данные. Проверенным специалистам можно доверять больше."
    ]},
  { q:"Как работает система оценок?",
    a:[
      "После выполнения заказа работодатель ставит оценку от 1 до 5 звёзд. Рейтинг отображается на карточке специалиста. Чем выше оценка — тем выше специалист в сортировке по ",
      {text:"«Рейтингу»",key:"catalog"},
      "."
    ]},
  { q:"Можно ли изменить свои данные?",
    a:[
      "Да. Зайдите в ",
      {text:"«Личный кабинет»",key:"profile"},
      " → «Личные данные» → «Редактировать»."
    ]},
];

// ─── SMS SERVICE ──────────────────────────────────────────────────────────────
async function sendSmsCode(phone, code){
  // REPLACE WITH REAL SMS API (SMSC.ru, SMS.ru etc.)
  console.log(`[SMS DEV] Код для ${phone}: ${code}`);
  return true;
}

// ─── API TRANSFORMS ──────────────────────────────────────────────────────────
function mapWorker(w){
  return{
    ...w,
    salaryNum:w.salary_num??w.salaryNum??0,
    travelCities:w.travel_cities||w.travelCities||[],
    photoApproved:w.photo_approved??w.photoApproved??true,
    postedBy:w.posted_by??w.postedBy,
    services:(w.services||[]).map(s=>({
      ...s,
      from:s.from_price??s.from??null,
      to:s.to_price??s.to??null,
    })),
  };
}
function mapOrder(o){
  return{
    ...o,
    workerId:o.worker_id??o.workerId,
    employerId:o.employer_id??o.employerId,
    workerName:(o.worker_name??o.workerName)||"",
    workerProfession:(o.worker_profession??o.workerProfession)||"",
    workerPhone:(o.worker_phone??o.workerPhone)||"",
    employerName:(o.employer_name??o.employerName)||"",
    createdAt:o.created_at?new Date(o.created_at).toLocaleDateString("ru"):o.createdAt||"",
    completedAt:o.completed_at?new Date(o.completed_at).toLocaleDateString("ru"):o.completedAt||null,
    ratingSkippedSession:false,
  };
}
function mapRating(r){
  return{
    ...r,
    workerId:r.worker_id??r.workerId,
    employerId:r.employer_id??r.employerId,
    orderId:r.order_id??r.orderId,
    createdAt:r.created_at?new Date(r.created_at).toLocaleDateString("ru"):r.createdAt||"",
  };
}
function mapUser(u){
  return{
    ...u,
    phone2:u.phone2||"",
    registeredAt:u.registered_at?new Date(u.registered_at).toLocaleDateString("ru"):u.registeredAt||"",
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getInitials(name){
  return (name||"").split(" ").filter(w=>w.length>0).map(w=>w[0]).join("").toUpperCase().slice(0,2);
}
function plural(n,one,few,many){
  const m=n%10,h=n%100;
  if(m===1&&h!==11)return one;
  if([2,3,4].includes(m)&&![12,13,14].includes(h))return few;
  return many;
}
function avgRating(workerId,ratings){
  const r=ratings.filter(r=>r.workerId===workerId);
  if(r.length<1)return null;
  return r.reduce((a,b)=>a+b.score,0)/r.length;
}
function fmtPrice(svc){
  if(svc.negotiable)return"Договорная";
  const fmt=n=>n.toLocaleString("ru")+" ₽";
  if(svc.from&&svc.to)return`от ${fmt(svc.from)} до ${fmt(svc.to)}`;
  if(svc.from)return`от ${fmt(svc.from)}`;
  if(svc.to)return`до ${fmt(svc.to)}`;
  return"—";
}
function expYears(str){
  const m=(str||"").match(/\d+/);
  return m?parseInt(m[0]):0;
}
async function exportToExcel(users,workers,orders){
  const XLSX=await import("xlsx");
  const wb=XLSX.utils.book_new();
  const clientRows=users.filter(u=>u.role==="employer"||u.role==="admin").map(u=>{
    const myOrders=orders.filter(o=>o.employerId===u.id);
    return {
      "Телефон (ID)":u.phone,"Имя":u.name,"Доп. телефон":u.phone2||"—",
      "Роль":u.role==="admin"?"Администратор":"Работодатель",
      "Дата регистрации":u.registeredAt||"—",
      "Всего заказов":myOrders.length,
      "Выполнено":myOrders.filter(o=>o.status==="completed").length,
      "Специалисты":myOrders.map(o=>o.workerName).join(", ")||"—",
    };
  });
  const ws1=XLSX.utils.json_to_sheet(clientRows.length?clientRows:[{"Нет данных":"—"}]);
  ws1["!cols"]=[{wch:18},{wch:22},{wch:18},{wch:16},{wch:18},{wch:14},{wch:12},{wch:40}];
  XLSX.utils.book_append_sheet(wb,ws1,"Клиенты");
  const workerRows=users.filter(u=>u.role==="seeker").map(u=>{
    const profiles=workers.filter(w=>w.postedBy===u.id);
    const workerIds=profiles.map(w=>w.id);
    const myOrders=orders.filter(o=>workerIds.includes(o.workerId));
    return {
      "Телефон (ID)":u.phone,"Имя":u.name,"Доп. телефон":u.phone2||"—",
      "Дата регистрации":u.registeredAt||"—",
      "Профессия":profiles.map(w=>w.profession).join("; ")||"—",
      "Категория":profiles.map(w=>w.category||"—").join("; ")||"—",
      "Зарплата":profiles.map(w=>w.salary).join("; ")||"—",
      "Город":profiles.map(w=>w.city).join("; ")||"—",
      "Верифицирован":profiles.some(w=>w.verified)?"Да":"Нет",
      "Всего заказов":myOrders.length,
      "Заказчики":myOrders.map(o=>o.employerName).join(", ")||"—",
    };
  });
  const ws2=XLSX.utils.json_to_sheet(workerRows.length?workerRows:[{"Нет данных":"—"}]);
  ws2["!cols"]=[{wch:18},{wch:22},{wch:18},{wch:18},{wch:35},{wch:28},{wch:16},{wch:16},{wch:12},{wch:14},{wch:40}];
  XLSX.utils.book_append_sheet(wb,ws2,"Работники");
  XLSX.writeFile(wb,"База_AbhJob.xlsx");
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────

function Stars({score,size=14}){
  return(
    <span style={{display:"inline-flex",gap:1,alignItems:"center"}}>
      {[1,2,3,4,5].map(i=>(
        <Star key={i} size={size} fill={i<=Math.round(score)?"#f59e0b":"none"}
          color={i<=Math.round(score)?"#f59e0b":"#d1d5db"} strokeWidth={1.5}/>
      ))}
      <span style={{fontSize:size-1,color:"#6b7280",marginLeft:4,fontWeight:600}}>{score.toFixed(1)}</span>
    </span>
  );
}
function Avatar({name,photo,index,size=48}){
  // Nice gradient pairs per index
  const GRADIENTS=[
    ["#667eea","#764ba2"],["#f093fb","#f5576c"],["#4facfe","#00f2fe"],
    ["#43e97b","#38f9d7"],["#fa709a","#fee140"],["#a18cd1","#fbc2eb"],
    ["#fccb90","#d57eeb"],["#a1c4fd","#c2e9fb"],
  ];
  const [c1,c2]=GRADIENTS[(index||0)%GRADIENTS.length];
  const initials=getInitials(name);
  const id=`grad-${(index||0)}`;
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <defs><linearGradient id='${id}' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${c1}'/>
      <stop offset='100%' stop-color='${c2}'/>
    </linearGradient></defs>
    <circle cx='${size/2}' cy='${size/2}' r='${size/2}' fill='url(#${id})'/>
    <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle'
      font-family='system-ui,sans-serif' font-weight='700' font-size='${Math.round(size*0.36)}'
      fill='white'>${initials}</text>
  </svg>`;
  const src=`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  if(photo&&photo.startsWith("data:")){
    return <img src={photo} alt={name} style={{width:size,height:size,borderRadius:"50%",
      objectFit:"cover",flexShrink:0,border:"2px solid rgba(255,255,255,0.8)"}}/>;
  }
  return <img src={src} alt={name} style={{width:size,height:size,borderRadius:"50%",
    flexShrink:0,border:"2px solid rgba(255,255,255,0.6)"}}/>;
}
function Badge({children,bg="#eff6ff",color="#2563eb",style={}}){
  return(
    <span style={{background:bg,color,borderRadius:20,padding:"3px 10px",
      fontSize:12,fontWeight:600,whiteSpace:"nowrap",display:"inline-flex",
      alignItems:"center",gap:4,...style}}>{children}</span>
  );
}
function Inp({label,value,onChange,placeholder,type="text",error,required,hint}){
  const [focus,setFocus]=useState(false);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {label&&<label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
        {label}{required&&<span style={{color:"#dc2626"}}> *</span>}
      </label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{border:`1.5px solid ${error?"#dc2626":focus?"#2563eb":"#e5e7eb"}`,
          borderRadius:10,padding:"10px 14px",fontSize:14,outline:"none",
          fontFamily:"inherit",width:"100%",boxSizing:"border-box",
          background:"#fff",transition:"border-color 0.15s",color:"#111"}}/>
      {hint&&!error&&<span style={{fontSize:12,color:"#9ca3af"}}>{hint}</span>}
      {error&&<span style={{fontSize:12,color:"#dc2626"}}>{error}</span>}
    </div>
  );
}
function PhoneInp({value,onChange,error,label="Номер телефона",required}){
  const [focus,setFocus]=useState(false);
  // Единое поле: оставляем + и цифры, не навязываем формат
  const handleChange=v=>{
    if(v==="")return onChange("");
    // Разрешаем только + (только в начале) и цифры
    let clean=v.replace(/[^\d+]/g,"");
    // + разрешён только в начале
    if(clean.indexOf("+")>0)clean=clean.replace(/\+/g,"");
    // Ограничение длины: +XXXXXXXXXXXX (13 символов) или 8XXXXXXXXXXX (11 цифр)
    if(clean.startsWith("+")&&clean.length>13)clean=clean.slice(0,13);
    if(!clean.startsWith("+")&&clean.length>11)clean=clean.slice(0,11);
    onChange(clean);
  };
  const border=`1.5px solid ${error?"#dc2626":focus?"#2563eb":"#e5e7eb"}`;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
        {label}{required&&<span style={{color:"#dc2626"}}> *</span>}
      </label>
      <input type="text" inputMode="tel" value={value}
        onChange={e=>handleChange(e.target.value)}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        placeholder="+7XXXXXXXXXX или 8XXXXXXXXXX"
        style={{border,borderRadius:10,padding:"10px 14px",fontSize:14,
          outline:"none",fontFamily:"inherit",background:"#fff",
          color:"#111",fontWeight:700,letterSpacing:"1px",
          transition:"border-color 0.15s",boxSizing:"border-box",width:"100%"}}/>
      {error&&<span style={{fontSize:12,color:"#dc2626"}}>{error}</span>}
    </div>
  );
}
function CityPicker({selected,onChange}){
  const toggle=c=>onChange(selected.includes(c)?selected.filter(x=>x!==c):[...selected,c]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>Готов выехать в:</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {ABKHAZIA_CITIES.map(city=>{
          const on=selected.includes(city);
          return(
            <button key={city} type="button" onClick={()=>toggle(city)} style={{
              padding:"5px 13px",borderRadius:20,fontSize:13,cursor:"pointer",fontWeight:600,
              border:on?"none":"1.5px solid #e5e7eb",
              background:on?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#fff",color:on?"#fff":"#374151",transition:"all 0.15s",
            }}>{city}</button>
          );
        })}
      </div>
      {!selected.length&&<span style={{fontSize:12,color:"#9ca3af"}}>Не выбрано</span>}
    </div>
  );
}
function ConfirmModal({message,onConfirm,onCancel}){
  const [loading,setLoading]=useState(false);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}}>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:380,
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:8}}>Подтверждение</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:24,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} disabled={loading} style={{background:"#f3f4f6",border:"none",borderRadius:10,
            padding:"9px 20px",fontSize:13,fontWeight:600,color:"#374151",cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1}}>
            Отмена
          </button>
          <button onClick={async()=>{setLoading(true);await onConfirm();}} disabled={loading}
            style={{background:"#dc2626",border:"none",borderRadius:10,
            padding:"9px 20px",fontSize:13,fontWeight:600,color:"#fff",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
            {loading?"Удаление...":"Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast(){
  const [toasts,setToasts]=useState([]);
  const show=useRef(null);
  show.current=(msg,type="success")=>{
    const id=uid();
    setToasts(p=>[...p,{id,msg,type,out:false}]);
    setTimeout(()=>setToasts(p=>p.map(t=>t.id===id?{...t,out:true}:t)),3000);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3250);
  };
  const toast=(msg,type)=>show.current(msg,type);
  const ToastContainer=()=>(
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",gap:8,pointerEvents:"none"}}>
      {toasts.map(t=>(
        <div key={t.id} className={t.out?"toast-out":"toast-in"}
          style={{display:"flex",alignItems:"center",gap:10,
            padding:"12px 20px",borderRadius:14,
            background:t.type==="error"?"#fee2e2":t.type==="info"?"#eff6ff":"#f0fdf4",
            border:`1px solid ${t.type==="error"?"#fca5a5":t.type==="info"?"#bfdbfe":"#86efac"}`,
            boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
            fontSize:14,fontWeight:600,whiteSpace:"nowrap",
            color:t.type==="error"?"#dc2626":t.type==="info"?"#2563eb":"#16a34a"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
  return{toast,ToastContainer};
}

function WorkerCardSkeleton(){
  const m=useIsMobile();
  return(
    <div style={{background:"#fff",border:"1px solid #f3f4f6",borderRadius:m?12:16,
      padding:m?"14px":"20px",display:"flex",flexDirection:"column",gap:12,
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <div className="skeleton" style={{width:48,height:48,borderRadius:"50%",flexShrink:0}}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          <div className="skeleton" style={{height:14,width:"60%"}}/>
          <div className="skeleton" style={{height:12,width:"40%"}}/>
          <div className="skeleton" style={{height:11,width:"70%"}}/>
        </div>
      </div>
      <div className="skeleton" style={{height:11,width:"35%",borderRadius:20}}/>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <div className="skeleton" style={{height:32}}/>
        <div className="skeleton" style={{height:32}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div className="skeleton" style={{height:44,width:100}}/>
        <div className="skeleton" style={{height:44,flex:1}}/>
      </div>
    </div>
  );
}

function Overlay({onClose,children,maxWidth=540}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-slide" style={{background:"#fff",borderRadius:20,padding:32,width:"100%",
        maxWidth,maxHeight:"90vh",overflowY:"auto",position:"relative",
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,
          background:"#f3f4f6",border:"none",width:32,height:32,borderRadius:"50%",
          cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <X size={16}/>
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────────

function PhotoUpload({value,onChange}){
  const [photoErr,setPhotoErr]=useState("");
  const handleFile=async e=>{
    const file=e.target.files[0];
    if(!file)return;
    if(file.size>3*1024*1024){setPhotoErr("Фото не должно превышать 3 МБ");return;}
    setPhotoErr("");
    try{
      const compressed=await compressImage(file);
      onChange(compressed);
    }catch{
      setPhotoErr("Не удалось загрузить фото. Попробуйте другой файл.");
    }
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>Фото профиля</label>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        {value?(
          <img src={value} alt="preview" style={{width:64,height:64,borderRadius:"50%",
            objectFit:"cover",border:"2px solid #e5e7eb"}}/>
        ):(
          <div style={{width:64,height:64,borderRadius:"50%",background:"#f3f4f6",
            display:"flex",alignItems:"center",justifyContent:"center",border:"2px dashed #d1d5db"}}>
            <User size={24} color="#9ca3af"/>
          </div>
        )}
        <div>
          <label style={{display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer",
            background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:10,
            padding:"8px 16px",fontSize:13,fontWeight:600,color:"#374151"}}>
            <ImagePlus size={15}/>
            {value?"Сменить фото":"Загрузить фото"}
            <input type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
          </label>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:5}}>
            JPG, PNG · до 3 МБ · Фото проверяется модератором
          </div>
          {photoErr&&<div style={{fontSize:12,color:"#dc2626",marginTop:4}}>{photoErr}</div>}
        </div>
        {value&&(
          <button type="button" onClick={()=>onChange(null)} style={{background:"none",border:"none",
            color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:600}}>Удалить</button>
        )}
      </div>
    </div>
  );
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
// ─── LOGO ─────────────────────────────────────────────────────────────────────
function LogoIcon({size=32}){
  const r=Math.round(size*0.28);
  const pathRef1=useRef(null);
  const pathRef2=useRef(null);
  const leftRef=useRef(null);
  const rightRef=useRef(null);
  const centerRef=useRef(null);
  const rafRef=useRef(null);

  useEffect(()=>{
    let t=0;
    const A=2.0, λ=10, speed=0.07, mid=13;
    const k=(2*Math.PI)/λ;
    const xL=5, xC=10, xR=15;
    const frame=()=>{
      t+=speed;
      let d1=`M 1 ${mid}`, d2=`M 1 ${mid}`;
      for(let x=1;x<=19;x+=0.6){
        d1+=` L ${x.toFixed(1)} ${(mid+A*Math.sin(k*x-t)).toFixed(2)}`;
        d2+=` L ${x.toFixed(1)} ${(mid+A*Math.sin(k*x-t+Math.PI)).toFixed(2)}`;
      }
      if(pathRef1.current) pathRef1.current.setAttribute("d",d1);
      if(pathRef2.current) pathRef2.current.setAttribute("d",d2);
      // люди двигаются вместе с волной под ними
      const dyL=(A*Math.sin(k*xL-t)).toFixed(2);
      const dyC=(A*Math.sin(k*xC-t)).toFixed(2);
      const dyR=(A*Math.sin(k*xR-t)).toFixed(2);
      if(leftRef.current)   leftRef.current.setAttribute("transform",`translate(0,${dyL})`);
      if(centerRef.current) centerRef.current.setAttribute("transform",`translate(0,${dyC})`);
      if(rightRef.current)  rightRef.current.setAttribute("transform",`translate(0,${dyR})`);
      rafRef.current=requestAnimationFrame(frame);
    };
    rafRef.current=requestAnimationFrame(frame);
    return()=>cancelAnimationFrame(rafRef.current);
  },[]);

  return(
    <div style={{width:size,height:size,borderRadius:r,flexShrink:0,
      background:"linear-gradient(to top right,#0c4a6e 0%,#0369a1 35%,#0ea5e9 70%,#38bdf8 100%)",
      boxShadow:"0 2px 14px rgba(12,74,110,.5)",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg width={Math.round(size*0.65)} height={Math.round(size*0.62)}
           viewBox="0 0 20 19" fill="none" overflow="visible">
        {/* Левый человек */}
        <g ref={leftRef}>
          <circle cx="5"   cy="7"   r="2.4" fill="white" opacity=".75"/>
          <rect   x="3"    y="9.3"  width="4" height="4.5" rx="2" fill="white" opacity=".75"/>
        </g>
        {/* Правый человек */}
        <g ref={rightRef}>
          <circle cx="15"  cy="7"   r="2.4" fill="white" opacity=".75"/>
          <rect   x="13"   y="9.3"  width="4" height="4.5" rx="2" fill="white" opacity=".75"/>
        </g>
        {/* Центральный */}
        <g ref={centerRef}>
          <circle cx="10"  cy="5.5" r="3.2" fill="white"/>
          <rect   x="7.5"  y="8.5"  width="5" height="5.5" rx="2.5" fill="white"/>
        </g>
        {/* Бегущая синусоида — линия воды */}
        <path ref={pathRef1} stroke="white" strokeWidth="1.6"
              strokeLinecap="round" fill="none" opacity=".9"/>
        <path ref={pathRef2} stroke="white" strokeWidth="0.7"
              strokeLinecap="round" fill="none" opacity=".25"/>
      </svg>
    </div>
  );
}

function HamburgerMenu({currentUser,onNav,onLogout}){
  const [open,setOpen]=useState(false);
  const items=[
    {Icon:User,       label:"Личный кабинет",            key:"profile"},
    {Icon:Search,     label:"Специалисты",                key:"catalog"},
    {Icon:ClipboardList,label:"История заказов",          key:"orders"},
    {Icon:FileText,   label:"Разместить анкету",          key:"postWorker"},
    {Icon:HelpCircle, label:"Вопросы и ответы",           key:"faq"},
    {Icon:Shield,     label:"Политика конфиденциальности",key:"privacy"},
    {Icon:FileText,   label:"Пользовательское соглашение",key:"terms"},
  ];
  const go=key=>{setOpen(false);onNav(key);};
  return(
    <div style={{position:"relative",zIndex:150}}>
      <button onClick={()=>setOpen(true)} style={{background:"none",border:"none",
        cursor:"pointer",padding:"8px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Menu size={24} color="#111"/>
      </button>
      {open&&<div style={{position:"fixed",top:52,inset:"52px 0 0 0",zIndex:149,
        background:"rgba(0,0,0,0.25)"}} onClick={()=>setOpen(false)}/>}
      <div style={{position:"fixed",top:52,left:0,bottom:0,width:"min(300px,calc(100vw - 20px))",
        background:"rgba(255,255,255,0.85)",backdropFilter:"blur(18px)",
        WebkitBackdropFilter:"blur(18px)",
        boxShadow:"6px 0 30px rgba(0,0,0,0.12)",zIndex:150,
        borderRadius:"0 24px 24px 0",
        transform:open?"translateX(0)":"translateX(-100%)",
        transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        display:"flex",flexDirection:"column"}}>
        <button onClick={()=>setOpen(false)} style={{
          position:"absolute",top:8,right:8,
          background:"rgba(0,0,0,0.06)",border:"none",borderRadius:"50%",
          width:34,height:34,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <X size={18} color="#111"/>
        </button>
        {currentUser&&(<div style={{padding:"14px 22px",borderBottom:"1px solid #f3f4f6",
            display:"flex",alignItems:"center",gap:11}}>
            <Avatar name={currentUser.name} photo={null} index={currentUser.id%8} size={38}/>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#111"}}>{currentUser.name}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>
                {currentUser.role==="admin"?"Администратор":
                 currentUser.role==="employer"?"Работодатель":"Работник"}
              </div>
            </div>
          </div>
        )}
        <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
          {items.map(item=>(
            <button key={item.key} onClick={()=>go(item.key)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:13,
              padding:"13px 22px",border:"none",background:"none",
              cursor:"pointer",fontSize:14,color:"#0c4a6e",fontFamily:"inherit",
              textAlign:"left",transition:"background 0.12s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(56,189,248,0.08)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <item.Icon size={17} color="#0ea5e9" strokeWidth={1.8}/>
              <span style={{fontWeight:600}}>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid #e0f2fe"}}>
          {currentUser?(
            <button onClick={()=>{setOpen(false);onLogout();}} style={{
              width:"100%",display:"flex",alignItems:"center",gap:12,
              padding:"11px 16px",border:"1px solid #fee2e2",borderRadius:10,
              background:"#fff5f5",cursor:"pointer",fontSize:14,
              color:"#dc2626",fontFamily:"inherit",fontWeight:600}}>
              <LogOut size={16}/>Выйти из аккаунта
            </button>
          ):(
            <button onClick={()=>{setOpen(false);onNav("auth");}} style={{
              width:"100%",display:"flex",alignItems:"center",gap:12,
              padding:"11px 16px",border:"none",borderRadius:10,
              background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",
              cursor:"pointer",fontSize:14,
              color:"#fff",fontFamily:"inherit",fontWeight:600}}>
              <User size={16}/>Войти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// Маппинг ключевых слов услуг → категория
const SERVICE_CATEGORY_MAP = [
  {keywords:["ремонт","строительство","сварка","кладка","штукатур","плитка","кровля","фундамент","бетон","монтаж","отделка"], cat:"Ремонт и строительство"},
  {keywords:["уборка","клининг","мытье","чистка","стирка","глажка","готовка","хозяйство","домработ"], cat:"Уборка и помощь по хозяйству"},
  {keywords:["груз","перевозка","переезд","такси","доставка","транспорт"], cat:"Грузоперевозки"},
  {keywords:["авто","автомобиль","машина","двигатель","тормоз","кузов","диагностика","шиномонтаж"], cat:"Ремонт транспорта"},
  {keywords:["стрижка","маникюр","педикюр","макияж","брови","ресниц","массаж","косметолог","парикмахер","красота"], cat:"Красота и здоровье"},
  {keywords:["фото","видео","съёмка","монтаж","реклама","аудио","звук","музыка"], cat:"Фото, видео и аудио"},
  {keywords:["сайт","программ","разработка","верстка","приложение","код","it","1с","бот"], cat:"IT и программирование"},
  {keywords:["холодильник","стиралка","кондиционер","телевизор","техника","установка","настройка"], cat:"Установка и ремонт техники"},
  {keywords:["компьютер","ноутбук","вирус","настройка","windows","интернет","wi-fi","принтер"], cat:"Компьютерная помощь"},
  {keywords:["телефон","планшет","экран","зарядка","смартфон","apple","samsung"], cat:"Ремонт цифровой техники"},
  {keywords:["дизайн","логотип","иллюстрация","баннер","визитка","полиграфия","арт"], cat:"Дизайн и творчество"},
  {keywords:["юрист","адвокат","бухгалтер","налог","договор","документ","нотариус"], cat:"Юридическая и бухгалтерская помощь"},
  {keywords:["репетитор","обучение","урок","английский","математика","школа","подготовка"], cat:"Репетиторы и обучение"},
  {keywords:["праздник","мероприятие","ведущий","аниматор","тамада","торт","декор"], cat:"Праздники и мероприятия"},
  {keywords:["туризм","экскурсия","гид","тур","пляж","маршрут","путешествие"], cat:"Туризм и экскурсии"},
];

function guessCategory(services){
  if(!services||!services.length) return null;
  const text=services.map(s=>s.name||"").join(" ").toLowerCase();
  let best=null, bestScore=0;
  SERVICE_CATEGORY_MAP.forEach(({keywords,cat})=>{
    const score=keywords.filter(k=>text.includes(k)).length;
    if(score>bestScore){bestScore=score;best=cat;}
  });
  return bestScore>0?best:null;
}

function CategoryAutocomplete({value, onChange, services, error}){
  const [input,setInput]=useState(value||"");
  const [open,setOpen]=useState(false);
  const suggested=guessCategory(services);
  const allCats=CATEGORIES.map(c=>c.label);
  const matches=input.trim()
    ? allCats.filter(c=>c.toLowerCase().includes(input.toLowerCase()))
    : allCats;

  const select=cat=>{setInput(cat);onChange(cat);setOpen(false);};

  useEffect(()=>{if(value!==input)setInput(value||"");},[value]);

  return(
    <div style={{position:"relative"}}>
      <input
        value={input}
        onChange={e=>{setInput(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),150)}
        placeholder="Начните вводить или выберите..."
        style={{width:"100%",border:`1.5px solid ${error?"#dc2626":"#e5e7eb"}`,
          borderRadius:10,padding:"10px 14px",fontSize:14,
          fontFamily:"inherit",background:"#fff",color:"#111",outline:"none",
          boxSizing:"border-box"}}
      />
      {/* Подсказка по услугам */}
      {suggested&&!value&&(
        <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8,
          background:"#f0f7ff",borderRadius:8,padding:"7px 12px",
          border:"1px solid #bae6fd",cursor:"pointer"}}
          onClick={()=>select(suggested)}>
          <span style={{fontSize:12,color:"#0369a1"}}>💡 Подходит:</span>
          <span style={{fontSize:13,fontWeight:700,color:"#0c4a6e"}}>{suggested}</span>
          <span style={{fontSize:11,color:"#0ea5e9",marginLeft:"auto"}}>Выбрать →</span>
        </div>
      )}
      {/* Выпадающий список */}
      {open&&matches.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,
          background:"#fff",borderRadius:10,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
          border:"1px solid #e5e7eb",maxHeight:200,overflowY:"auto",marginTop:4}}>
          {matches.map(cat=>(
            <div key={cat} onMouseDown={()=>select(cat)}
              style={{padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#0c4a6e",fontWeight:600,
                borderBottom:"1px solid #f3f4f6"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f7ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

function AuthModal({onAuth,onClose,users,setUsers}){
  const m=useIsMobile();
  const [tab,setTab]=useState("login");
  const [step,setStep]=useState("form"); // form | sms
  const [role,setRole]=useState("employer"); // employer | seeker
  const [avatar,setAvatar]=useState(null);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const fullName=(firstName.trim()+" "+lastName.trim()).trim();
  const [phone,setPhone]=useState("+7940");
  const [password,setPassword]=useState("");
  const [showPass,setShowPass]=useState(false);
  // worker profile fields (only for seeker)
  const [wp,setWp]=useState({
    category:"",gender:"",profession:"",experience:"",city:"",age:"",
    salary:"",travelCities:[],skills:"",about:"",services:[],
  });
  const [err,setErr]=useState({});
  const [msg,setMsg]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [smsCode,setSmsCode]=useState("");
  const [resendTimer,setResendTimer]=useState(0);

  const timerRef=useRef(null);
  useEffect(()=>()=>{if(timerRef.current)clearInterval(timerRef.current);},[]);
  const startTimer=()=>{
    if(timerRef.current)clearInterval(timerRef.current);
    setResendTimer(60);
    timerRef.current=setInterval(()=>setResendTimer(t=>{if(t<=1){clearInterval(timerRef.current);timerRef.current=null;return 0;}return t-1;}),1000);
  };

  const login=async()=>{
    setMsg("");
    if(phone.length<12){setMsg("Введите полный номер телефона (+7940XXXXXXX)");return;}
    if(!password){setMsg("Введите пароль");return;}
    try{
      const{user}=await api.login(phone,password);
      onAuth(mapUser(user));
    }catch(e){
      if(e.message?.includes("Неверный"))
        setMsg("Неверный номер или пароль. Проверьте данные и попробуйте снова.");
      else
        setMsg(e.message||"Ошибка входа. Попробуйте позже.");
    }
  };

  const requestSms=async()=>{
    const e={};
    if(!firstName.trim())e.firstName="Введите имя";
    if(firstName.trim()&&checkText(fullName))e.firstName="Имя содержит недопустимые слова";
    if(phone.length<12)e.phone="Введите полный номер телефона (+7940XXXXXXX)";
    if(password.length<6)e.password="Пароль должен содержать минимум 6 символов";
    if(role==="seeker"){
      if(!wp.category)e.wpCategory="Выберите категорию услуг";
      if(!wp.gender)e.wpGender="Укажите пол";
      if(!wp.profession.trim())e.wpProfession="Укажите вашу профессию или специализацию";
      if(!wp.experience.trim())e.wpExperience="Укажите опыт работы (например: 3 года)";
      if(!wp.city.trim())e.wpCity="Укажите город проживания";
    }
    if(Object.keys(e).length){setErr(e);return;}
    setMsg("");
    setSubmitting(true);
    try{
      await api.sendSms(phone);
      setStep("sms");
      startTimer();
    }catch(ex){
      if(ex.message?.includes("уже зарегистрирован")||ex.message?.includes("already"))
        setMsg("Этот номер уже зарегистрирован. Попробуйте войти.");
      else
        setMsg(ex.message||"Не удалось отправить SMS. Проверьте номер и попробуйте снова.");
    }finally{setSubmitting(false);}
  };

  const verifySms=async()=>{
    setMsg("");
    try{
      const{user}=await api.register({
        name:fullName,phone,password,role,smsCode:smsCode.trim(),
      });
      const u=mapUser(user);
      if(role==="seeker"){
        const salaryNum=parseInt((wp.salary||"").replace(/\D/g,""))||0;
        const workerBody={
          name:fullName,phone,category:wp.category,profession:wp.profession,
          gender:wp.gender,experience:wp.experience,city:wp.city,
          travel_cities:wp.travelCities,age:parseInt(wp.age)||0,
          salary:wp.salary||"",salary_num:salaryNum,
          skills:wp.skills,about:wp.about,
          photo:avatar||null,
          services:(wp.services||[]).map(s=>({name:s.name,from:s.from,to:s.to,negotiable:s.negotiable||false})),
        };
        try{
          const wRes=await api.createWorker(workerBody);
          onAuth(u,mapWorker(wRes));
        }catch(ex){
          setMsg(ex.message||"Анкета не создана. Добавьте её позже в личном кабинете.");
          onAuth(u);
        }
        return;
      }
      onAuth(u);
    }catch(ex){
      if(ex.message?.includes("Неверный")||ex.message?.includes("устаревший"))
        setMsg("Неверный код. Убедитесь что вводите последний полученный код, или запросите новый.");
      else if(ex.message?.includes("зарегистрирован"))
        setMsg("Этот номер уже зарегистрирован. Закройте окно и войдите через «Вход».");
      else
        setMsg(ex.message||"Ошибка регистрации. Попробуйте позже.");
    }
  };

  // Avatar upload
  const pickAvatar=()=>{
    const inp=document.createElement("input");
    inp.type="file";inp.accept="image/*";inp.capture="user";
    inp.onchange=async e=>{
      const file=e.target.files[0];
      if(!file)return;
      try{
        const compressed=await compressImage(file);
        setAvatar(compressed);
      }catch{
        setMsg("Не удалось загрузить фото. Попробуйте другой файл.");
      }
    };
    inp.click();
  };

  const isSeeker=role==="seeker";
  const maxW=step==="sms"?400:isSeeker?600:420;

  return(
    <Overlay onClose={onClose} maxWidth={maxW}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
          <LogoIcon size={48} />
        </div>
        <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#111"}}>
          {step==="sms"?"Подтверждение номера":tab==="login"?"Вход в AbhJob":"Регистрация"}
        </h2>
      </div>

      {step==="sms"?(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <button onClick={()=>{setStep("form");setMsg("");setSmsCode("");}}
            style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",
              cursor:"pointer",color:"#6b7280",fontSize:13,padding:0,marginBottom:4}}>
            <ArrowLeft size={15}/>Назад
          </button>
          <div style={{background:"#f8faff",borderRadius:10,padding:"12px 16px",
            fontSize:13,color:"#374151",textAlign:"center"}}>
            Код отправлен на <strong>{phone}</strong>
          </div>
          <div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:8,
            padding:"8px 12px",fontSize:12,color:"#854d0e",textAlign:"center"}}>
            📱 SMS отправлена на указанный номер
          </div>
          <input type="text" value={smsCode}
            onChange={e=>{setSmsCode(e.target.value.replace(/\D/g,"").slice(0,6));setMsg("");}}
            placeholder="• • • • • •" maxLength={6}
            style={{border:"1.5px solid #e5e7eb",borderRadius:10,padding:"14px",
              fontSize:28,textAlign:"center",letterSpacing:"0.5em",fontWeight:700,
              outline:"none",width:"100%",boxSizing:"border-box"}}/>
          {msg&&<div style={{color:"#dc2626",fontSize:13,textAlign:"center"}}>{msg}</div>}
          <button onClick={verifySms} disabled={smsCode.length<6}
            style={{background:smsCode.length===6?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#e5e7eb",color:"#fff",
              border:"none",borderRadius:10,padding:"13px",fontSize:15,
              cursor:smsCode.length===6?"pointer":"default",fontWeight:700}}>
            Подтвердить →
          </button>
          <div style={{textAlign:"center",fontSize:13,color:"#9ca3af"}}>
            {resendTimer>0?`Повторно через ${resendTimer} сек.`
              :<span style={{color:"#2563eb",cursor:"pointer",fontWeight:600}}
                onClick={async()=>{try{await api.sendSms(phone);}catch(ex){setMsg(ex.message||"Ошибка SMS");}setSmsCode("");setMsg("");startTimer();}}>
                Отправить снова
              </span>}
          </div>
        </div>
      ):(
        <>
          {/* Tabs */}
          <div style={{display:"flex",marginBottom:20,background:"#f3f4f6",borderRadius:10,padding:3}}>
            {["login","register"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setMsg("");setErr({});}}
                style={{flex:1,padding:"9px",border:"none",cursor:"pointer",fontWeight:700,
                  fontSize:14,fontFamily:"inherit",borderRadius:8,transition:"all 0.15s",
                  background:tab===t?"#fff":"transparent",color:tab===t?"#111":"#6b7280",
                  boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {t==="login"?"Войти":"Регистрация"}
              </button>
            ))}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* ── REGISTER fields ── */}
            {tab==="register"&&<>

              {/* Avatar */}
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <button type="button" onClick={pickAvatar} style={{
                  width:64,height:64,borderRadius:"50%",border:"2px dashed #d1d5db",
                  background:avatar?"transparent":"#f9fafb",
                  cursor:"pointer",overflow:"hidden",padding:0,flexShrink:0}}>
                  {avatar
                    ?<img src={avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<div style={{display:"flex",flexDirection:"column",alignItems:"center",
                        justifyContent:"center",height:"100%",gap:3}}>
                        <ImagePlus size={18} color="#9ca3af"/>
                        <span style={{fontSize:9,color:"#9ca3af",fontWeight:600}}>ФОТО</span>
                      </div>}
                </button>
                <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>
                  Нажмите чтобы добавить фото профиля.<br/>
                  <span style={{color:"#9ca3af"}}>Сделать снимок или загрузить из галереи</span>
                </div>
              </div>

              {/* Name — two fields */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Inp label="Имя" value={firstName}
                  onChange={e=>{setFirstName(e.target.value);setErr({...err,firstName:""});}}
                  placeholder="Аслан" error={err.firstName} required/>
                <Inp label="Фамилия" value={lastName}
                  onChange={e=>setLastName(e.target.value)}
                  placeholder="Барциц"/>
              </div>

              {/* Role */}
              <div style={{display:"flex",gap:8}}>
                {[{val:"employer",label:"Работодатель",Icon:Building2},
                  {val:"seeker",label:"Работник",Icon:User}].map(r=>(
                  <button key={r.val} type="button" onClick={()=>{setRole(r.val);setErr({});}} style={{
                    flex:1,padding:"10px 8px",borderRadius:10,fontSize:13,cursor:"pointer",
                    fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                    border:role===r.val?"none":"1.5px solid #e5e7eb",
                    background:role===r.val?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#fff",
                    color:role===r.val?"#fff":"#374151",transition:"all 0.15s"}}>
                    <r.Icon size={14}/>{r.label}
                  </button>
                ))}
              </div>

              {/* Worker profile fields */}
              {isSeeker&&(
                <div style={{display:"flex",flexDirection:"column",gap:12,
                  background:"#F5F8FB",borderRadius:12,padding:"16px",
                  border:"1px solid #f3f4f6"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#9ca3af",
                    textTransform:"uppercase",letterSpacing:"0.06em"}}>Анкета работника</div>

                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
                      Категория <span style={{color:"#dc2626"}}>*</span>
                    </label>
                    <CategoryAutocomplete
                      value={wp.category}
                      onChange={v=>setWp({...wp,category:v})}
                      services={wp.services}
                      error={err.wpCategory}
                    />
                    {err.wpCategory&&<span style={{fontSize:12,color:"#dc2626"}}>{err.wpCategory}</span>}
                  </div>

                  <div style={{display:"flex",gap:8}}>
                    {[{val:"м",label:"Мужской"},{val:"ж",label:"Женский"}].map(g=>(
                      <button key={g.val} type="button" onClick={()=>setWp({...wp,gender:g.val})} style={{
                        flex:1,padding:"9px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                        border:wp.gender===g.val?"none":"1.5px solid #e5e7eb",
                        background:wp.gender===g.val?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#fff",
                        color:wp.gender===g.val?"#fff":"#374151"}}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {err.wpGender&&<span style={{fontSize:12,color:"#dc2626",marginTop:-8}}>{err.wpGender}</span>}

                  <Inp label="Профессия / специальность" value={wp.profession}
                    onChange={e=>setWp({...wp,profession:e.target.value})}
                    placeholder="Сварщик, повар..." error={err.wpProfession} required/>

                  <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:10}}>
                    <Inp label="Опыт работы" value={wp.experience}
                      onChange={e=>setWp({...wp,experience:e.target.value})}
                      placeholder="5 лет" error={err.wpExperience} required/>
                    <Inp label="Возраст" value={wp.age}
                      onChange={e=>setWp({...wp,age:e.target.value})}
                      placeholder="30" type="number"/>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:10}}>
                    <Inp label="Город" value={wp.city}
                      onChange={e=>setWp({...wp,city:e.target.value})}
                      placeholder="Сухум" error={err.wpCity} required/>
                    <Inp label="Ожидаемая оплата" value={wp.salary}
                      onChange={e=>setWp({...wp,salary:e.target.value})}
                      placeholder="80 000 ₽ (необязательно)"/>
                  </div>

                  <div style={{background:"#fff",borderRadius:10,padding:"12px",
                    border:"1px solid #f3f4f6"}}>
                    <CityPicker selected={wp.travelCities}
                      onChange={v=>setWp({...wp,travelCities:v})}/>
                  </div>

                  <Inp label="Навыки" value={wp.skills}
                    onChange={e=>setWp({...wp,skills:e.target.value})}
                    placeholder="Через запятую"/>

                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>О себе</label>
                    <textarea value={wp.about}
                      onChange={e=>setWp({...wp,about:e.target.value})}
                      placeholder="Расскажите о себе..." rows={2}
                      style={{border:"1.5px solid #e5e7eb",borderRadius:10,
                        padding:"10px 14px",fontSize:14,fontFamily:"inherit",
                        resize:"vertical",outline:"none"}}/>
                  </div>

                  <div style={{background:"#fff",borderRadius:10,padding:"12px",
                    border:"1px solid #f3f4f6"}}>
                    <ServicesPicker services={wp.services}
                      onChange={v=>setWp({...wp,services:v})}/>
                  </div>
                </div>
              )}
            </>}

            {/* Phone */}
            <PhoneInp value={phone}
              onChange={v=>{setPhone(v);setErr({...err,phone:""}); setMsg("");}}
              error={err.phone} required/>

            {/* Password */}
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>Пароль *</label>
              <div style={{position:"relative"}}>
                <input type={showPass?"text":"password"} value={password}
                  onChange={e=>{setPassword(e.target.value);setErr({...err,password:""});}}
                  placeholder="Минимум 6 символов"
                  style={{border:`1.5px solid ${err.password?"#dc2626":"#e5e7eb"}`,
                    borderRadius:10,padding:"10px 40px 10px 14px",fontSize:14,outline:"none",
                    fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{
                  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:0}}>
                  {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              {err.password&&<span style={{fontSize:12,color:"#dc2626"}}>{err.password}</span>}
            </div>

            {msg&&<div style={{background:"#fef2f2",borderRadius:8,padding:"10px 14px",
              color:"#dc2626",fontSize:13,display:"flex",gap:8,alignItems:"center"}}>
              <AlertCircle size={15}/>{msg}
            </div>}

            <button onClick={tab==="login"?login:requestSms} disabled={submitting}
              style={{background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",border:"none",borderRadius:10,
                padding:"13px",fontSize:15,cursor:submitting?"not-allowed":"pointer",fontWeight:700,marginTop:2,
                opacity:submitting?0.7:1}}>
              {submitting?"Загрузка...":(tab==="login"?"Войти →":"Получить код →")}
            </button>
          </div>

          {tab==="login"&&<p style={{textAlign:"center",marginTop:14,fontSize:13,color:"#9ca3af"}}>
            Нет аккаунта?{" "}
            <span style={{color:"#2563eb",cursor:"pointer",fontWeight:600}}
              onClick={()=>setTab("register")}>Зарегистрироваться</span>
          </p>}
        </>
      )}
    </Overlay>
  );
}

// ─── RATING PROMPT ────────────────────────────────────────────────────────────

function RatingPrompt({order,onRate,onSkip}){
  const [score,setScore]=useState(0);
  const [hover,setHover]=useState(0);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(3px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:16}}>
      <div style={{background:"#fff",borderRadius:24,padding:36,width:"100%",maxWidth:400,
        textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:40,marginBottom:12}}>⭐</div>
        <h2 style={{margin:"0 0 8px",fontSize:20,fontWeight:800,color:"#111"}}>Оцените работника</h2>
        <p style={{margin:"0 0 4px",color:"#374151",fontSize:15}}>
          Вы заказывали услугу у <strong>{order.workerName}</strong>
        </p>
        <p style={{margin:"0 0 24px",color:"#9ca3af",fontSize:13}}>{order.workerProfession}</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
          {[1,2,3,4,5].map(i=>(
            <Star key={i} size={40} strokeWidth={1.5}
              onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}
              onClick={()=>setScore(i)}
              fill={(hover||score)>=i?"#f59e0b":"none"}
              color={(hover||score)>=i?"#f59e0b":"#d1d5db"}
              style={{cursor:"pointer",transition:"transform 0.1s",
                transform:(hover||score)>=i?"scale(1.2)":"scale(1)"}}/>
          ))}
        </div>
        {score>0&&<p style={{margin:"0 0 20px",color:"#374151",fontSize:14,fontWeight:600}}>
          {["","😞 Плохо","😕 Не очень","😐 Нормально","😊 Хорошо","🤩 Отлично!"][score]}
        </p>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onSkip} style={{flex:1,border:"1px solid #e5e7eb",background:"#fff",
            borderRadius:10,padding:"11px",fontSize:14,cursor:"pointer",color:"#9ca3af"}}>
            Пропустить
          </button>
          <button onClick={()=>score>0&&onRate(score)} style={{flex:2,
            background:score>0?"#111827":"#e5e7eb",color:"#fff",border:"none",
            borderRadius:10,padding:"11px",fontSize:14,cursor:score>0?"pointer":"default",fontWeight:700}}>
            Отправить оценку
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CABINET PAGE ─────────────────────────────────────────────────────────────

function CabinetPage({currentUser,setCurrentUser,users,setUsers,workers,setWorkers,orders,setOrders,ratings,favorites,onToggleFav,onContact}){
  const m=useIsMobile();
  const [edit,setEdit]=useState(false);
  const [form,setForm]=useState({name:currentUser.name,phone:currentUser.phone,phone2:currentUser.phone2||""});
  const [saved,setSaved]=useState(false);
  const [saveErr,setSaveErr]=useState("");
  const [saving,setSaving]=useState(false);

  // Admin: pending photo approvals
  const pendingPhotos=workers.filter(w=>w.photo&&!w.photoApproved);
  const pendingWorkers=workers.filter(w=>!w.approved);

  const save=async()=>{
    if(checkText(form.name)){setSaveErr("Недопустимые слова в имени");return;}
    setSaveErr("");setSaving(true);
    try{
      const{user}=await api.updateMe({name:form.name,phone2:form.phone2});
      const u=mapUser(user);
      setCurrentUser(u);
      setEdit(false);setSaved(true);setTimeout(()=>setSaved(false),2500);
    }catch(e){
      setSaveErr(e.message||"Ошибка сохранения");
    }finally{setSaving(false);}
  };

  const row=(label,val)=>(
    <div style={{display:"flex",flexDirection:"column",gap:2,padding:"11px 0",borderBottom:"1px solid #f3f4f6"}}>
      <span style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
      <span style={{fontSize:15,fontWeight:600,color:"#111"}}>{val||"—"}</span>
    </div>
  );

  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:m?"12px 14px":"32px 16px",boxSizing:"border-box",width:"100%",overflowX:"hidden"}}>
      {/* Header */}
      <div style={{background:"#fff",borderRadius:16,padding:m?"18px 16px":"28px 28px 24px",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:24,color:"#111"}}>{currentUser.name}</div>
            <div style={{color:"#9ca3af",fontSize:13,marginTop:4}}>
              {currentUser.role==="admin"?"Администратор":
               currentUser.role==="employer"?"Работодатель":"Работник"}
              {" · "}с {currentUser.registeredAt}
            </div>
            {currentUser.role==="admin"&&(
              <button onClick={()=>exportToExcel(users,workers,orders)}
                style={{marginTop:14,background:"#16a34a",color:"#fff",border:"none",
                  borderRadius:10,padding:"9px 18px",fontSize:13,cursor:"pointer",
                  fontWeight:700,display:"inline-flex",alignItems:"center",gap:7}}>
                <Download size={15}/>Скачать базу (.xlsx)
              </button>
            )}
          </div>
          <Avatar name={currentUser.name} photo={null} index={currentUser.id%8} size={60}/>
        </div>
      </div>

      {/* Personal data */}
      <div style={{background:"#fff",borderRadius:16,padding:m?"16px":"24px 28px",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:800,color:"#111"}}>Личные данные</h3>
          {!edit&&<button onClick={()=>setEdit(true)} style={{background:"#f3f4f6",border:"none",
            borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",fontWeight:600,color:"#374151"}}>
            Редактировать
          </button>}
        </div>
        {saved&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,
          padding:"8px 14px",color:"#16a34a",fontSize:13,fontWeight:600,marginTop:8,marginBottom:4,
          display:"flex",alignItems:"center",gap:7}}>
          <CheckCircle size={15}/>Данные сохранены
        </div>}
        {!edit?(
          <div>
            {row("Имя",currentUser.name)}
            {row("Телефон",currentUser.phone)}
            {row("Доп. телефон",currentUser.phone2)}
            {row("Роль",currentUser.role==="employer"?"Работодатель":currentUser.role==="admin"?"Администратор":"Работник")}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:14}}>
            <Inp label="Имя и фамилия" value={form.name}
              onChange={e=>setForm({...form,name:e.target.value})} placeholder="Иван Иванов" required/>
            <PhoneInp value={form.phone} onChange={v=>setForm({...form,phone:v})} label="Основной телефон"/>
            <PhoneInp value={form.phone2} onChange={v=>setForm({...form,phone2:v})} label="Доп. телефон"/>
            {saveErr&&<div style={{fontSize:12,color:"#dc2626"}}>{saveErr}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setEdit(false);setSaveErr("");}} style={{flex:1,border:"1px solid #e5e7eb",
                background:"#fff",borderRadius:10,padding:"10px",fontSize:14,cursor:"pointer"}}>Отмена</button>
              <button onClick={save} disabled={saving} style={{flex:2,background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",border:"none",
                borderRadius:10,padding:"10px",fontSize:14,cursor:saving?"not-allowed":"pointer",fontWeight:700,opacity:saving?0.7:1}}>
                {saving?"Сохранение...":"Сохранить"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Избранное */}
      {currentUser.role!=="admin"&&(
        <div style={{background:"#fff",borderRadius:16,padding:m?"16px":"24px 28px",
          boxShadow:"0 2px 12px rgba(0,0,0,0.06)",marginBottom:12}}>
          <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:800,color:"#111",
            display:"flex",alignItems:"center",gap:8}}>
            <Heart size={17} color="#16a34a" fill="#16a34a"/>Избранные специалисты
          </h3>
          {favorites.length===0?(
            <div style={{textAlign:"center",padding:"24px 0",color:"#9ca3af",fontSize:13}}>
              Вы ещё не добавили никого в избранное.<br/>
              <span style={{fontSize:12}}>Нажмите ♡ на карточке специалиста в каталоге.</span>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {workers.filter(w=>favorites.includes(w.id)).map((w,i)=>(
                <div key={w.id} style={{display:"flex",alignItems:"center",gap:12,
                  padding:"12px 14px",borderRadius:12,border:"1px solid #f3f4f6",background:"#fafafa"}}>
                  <Avatar name={w.name} photo={w.photo&&w.photoApproved?w.photo:null} index={i} size={40}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#111"}}>{w.name}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>{w.profession} · {w.city}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>onContact(w)} style={{
                      background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",
                      border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,
                      cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                      <Phone size={12}/>Связаться
                    </button>
                    <button onClick={()=>onToggleFav(w.id)} title="Убрать из избранного"
                      style={{background:"none",border:"none",cursor:"pointer",padding:"4px",
                        display:"flex",alignItems:"center"}}>
                      <Heart size={18} color="#16a34a" fill="#16a34a" strokeWidth={2}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin panel */}
      {currentUser.role==="admin"&&(
        <AdminPanel users={users} workers={workers} setWorkers={setWorkers}
          orders={orders} ratings={ratings} m={m}/>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────

function AdminPanel({users,workers,setWorkers,orders,ratings,m}){
  const [tab,setTab]=useState("workers"); // workers | users
  const [editWorker,setEditWorker]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null); // {id, name}
  const {toast,ToastContainer}=useToast();

  return(
    <div style={{background:"#fff",borderRadius:16,padding:m?"16px":"24px 28px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
      <ToastContainer/>
      {confirmDelete&&(
        <ConfirmModal
          message={`Удалить анкету «${confirmDelete.name}»? Это действие нельзя отменить.`}
          onConfirm={async()=>{try{await api.deleteWorker(confirmDelete.id);setWorkers(prev=>prev.filter(x=>x.id!==confirmDelete.id));}catch(e){toast(e.message||"Ошибка при удалении","error");}setConfirmDelete(null);}}
          onCancel={()=>setConfirmDelete(null)}
        />
      )}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:m?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[
          {n:users.filter(u=>u.role!=="admin").length, label:"Пользователей", bg:"#eff6ff", c:"#2563eb"},
          {n:workers.length, label:"Анкет", bg:"#f0fdf4", c:"#16a34a"},
          {n:orders.filter(o=>o.status==="active").length, label:"Активных заказов", bg:"#fff7ed", c:"#ea580c"},
          {n:workers.filter(w=>!w.photoApproved&&w.photo).length, label:"Фото на модерации", bg:"#fdf4ff", c:"#9333ea"},
        ].map(({n,label,bg,c})=>(
          <div key={label} style={{background:bg,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:22,fontWeight:800,color:c}}>{n}</div>
            <div style={{fontSize:11,color:"#6b7280",lineHeight:1.3}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,borderBottom:"2px solid #f3f4f6",paddingBottom:12}}>
        {[["workers","Анкеты работников"],["users","Пользователи"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{
            padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",
            fontWeight:700,fontSize:13,fontFamily:"inherit",
            background:tab===key?"#111827":"#f3f4f6",
            color:tab===key?"#fff":"#374151"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Workers tab */}
      {tab==="workers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {workers.length===0&&<div style={{color:"#9ca3af",fontSize:14,padding:"20px 0",textAlign:"center"}}>Анкет пока нет</div>}
          {workers.map((w,i)=>{
            const rating=avgRating(w.id,ratings);
            const rCount=ratings.filter(r=>r.workerId===w.id).length;
            return(
              <div key={w.id} style={{border:"1px solid #f3f4f6",borderRadius:12,padding:"14px 16px",
                display:"flex",gap:12,alignItems:"center",background:i%2===0?"#fafafa":"#fff"}}>
                <Avatar name={w.name} photo={w.photo&&w.photoApproved?w.photo:null}
                  index={i} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:14,color:"#111"}}>{w.name}</span>
                    {w.verified&&<Badge bg="#eff6ff" color="#2563eb"><CheckCircle size={10}/>Проверен</Badge>}
                    {!w.photoApproved&&w.photo&&<Badge bg="#fdf4ff" color="#9333ea">Фото ждёт</Badge>}
                  </div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{w.profession} · {w.city}</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:1}}>
                    {rating!==null?`★ ${rating.toFixed(1)} (${rCount} оц.)`:`${rCount} оц.`}
                    {" · "}{w.salary}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>setEditWorker(w)} style={{
                    background:"#eff6ff",border:"none",borderRadius:8,padding:"7px 12px",
                    fontSize:12,cursor:"pointer",color:"#2563eb",fontWeight:600}}>
                    Изменить
                  </button>
                  <button onClick={()=>setConfirmDelete({id:w.id,name:w.name})} style={{
                    background:"#fff5f5",border:"none",borderRadius:8,padding:"7px 12px",
                    fontSize:12,cursor:"pointer",color:"#dc2626",fontWeight:600}}>
                    Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users tab */}
      {tab==="users"&&(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#F5F8FB",borderBottom:"2px solid #e5e7eb"}}>
                {["Имя","Телефон","Роль","Дата"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#374151",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u,i)=>(
                <tr key={u.id} style={{borderBottom:"1px solid #f3f4f6",background:i%2?"#fafafa":"#fff"}}>
                  <td style={{padding:"8px 12px",fontWeight:600}}>{u.name}</td>
                  <td style={{padding:"8px 12px",color:"#374151"}}>{u.phone}</td>
                  <td style={{padding:"8px 12px"}}>
                    <Badge bg={u.role==="employer"?"#fff7ed":u.role==="admin"?"#f3f4f6":"#eff6ff"}
                      color={u.role==="employer"?"#ea580c":u.role==="admin"?"#374151":"#2563eb"}>
                      {u.role==="employer"?"Работодатель":u.role==="admin"?"Админ":"Работник"}
                    </Badge>
                  </td>
                  <td style={{padding:"8px 12px",color:"#9ca3af"}}>{u.registeredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit worker modal */}
      {editWorker&&(
        <AdminWorkerEdit worker={editWorker}
          onSave={async updated=>{
            try{
              await api.updateWorker(updated.id,{
                name:updated.name,profession:updated.profession,city:updated.city,
                experience:updated.experience,salary:updated.salary,salary_num:updated.salaryNum,
                skills:updated.skills,about:updated.about,
                verified:updated.verified,approved:updated.approved,photo_approved:updated.photoApproved,
              });
              setWorkers(prev=>prev.map(w=>w.id===updated.id?updated:w));
              setEditWorker(null);
            }catch(e){toast(e.message||"Ошибка при сохранении","error");}
          }}
          onClose={()=>setEditWorker(null)}/>
      )}
    </div>
  );
}

// ─── ADMIN WORKER EDIT ────────────────────────────────────────────────────────

function AdminWorkerEdit({worker,onSave,onClose}){
  const m=useIsMobile();
  const [f,setF]=useState({...worker});
  const upd=(k,v)=>setF(prev=>({...prev,[k]:v}));

  return(
    <Overlay onClose={onClose} maxWidth={580}>
      <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800,color:"#111",paddingRight:28}}>
        Редактирование анкеты
      </h3>
      <p style={{margin:"0 0 20px",fontSize:13,color:"#9ca3af"}}>{worker.name}</p>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Verification & approval toggles */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {key:"verified",label:"✅ Проверен",desc:"Личность подтверждена"},
            {key:"approved",label:"👁 Анкета активна",desc:"Видна в каталоге"},
            {key:"photoApproved",label:"📷 Фото одобрено",desc:"Показывать фото"},
          ].map(({key,label,desc})=>(
            <button key={key} type="button" onClick={()=>upd(key,!f[key])} style={{
              padding:"10px 14px",borderRadius:10,cursor:"pointer",textAlign:"left",
              border:`2px solid ${f[key]?"#16a34a":"#e5e7eb"}`,
              background:f[key]?"#f0fdf4":"#fff",transition:"all 0.15s"}}>
              <div style={{fontSize:13,fontWeight:700,color:f[key]?"#16a34a":"#6b7280"}}>{label}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{desc}</div>
            </button>
          ))}
        </div>

        <Inp label="Имя и фамилия" value={f.name}
          onChange={e=>upd("name",e.target.value)} required/>
        <Inp label="Профессия" value={f.profession}
          onChange={e=>upd("profession",e.target.value)} required/>

        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:12}}>
          <Inp label="Город" value={f.city} onChange={e=>upd("city",e.target.value)}/>
          <Inp label="Опыт" value={f.experience} onChange={e=>upd("experience",e.target.value)}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:12}}>
          <Inp label="Ожидаемая оплата" value={f.salary} onChange={e=>upd("salary",e.target.value)}/>
          <Inp label="Возраст" value={f.age||""} onChange={e=>upd("age",e.target.value)} type="number"/>
        </div>

        <Inp label="Навыки" value={f.skills||""}
          onChange={e=>upd("skills",e.target.value)} placeholder="Через запятую"/>

        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>О себе</label>
          <textarea value={f.about||""} onChange={e=>upd("about",e.target.value)} rows={3}
            style={{border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",
              fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
        </div>

        {/* Services */}
        <div style={{background:"#F5F8FB",borderRadius:12,padding:"14px",border:"1px solid #f3f4f6"}}>
          <ServicesPicker services={f.services||[]} onChange={v=>upd("services",v)}/>
        </div>

        <div style={{display:"flex",gap:10,marginTop:6}}>
          <button onClick={onClose} style={{flex:1,border:"1px solid #e5e7eb",background:"#fff",
            borderRadius:10,padding:"11px",fontSize:14,cursor:"pointer",color:"#374151"}}>
            Отмена
          </button>
          <button onClick={()=>onSave(f)} style={{flex:2,background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",
            border:"none",borderRadius:10,padding:"11px",fontSize:14,cursor:"pointer",fontWeight:700}}>
            Сохранить изменения
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────

function CompleteOrderButton({order,orders,setOrders,m}){
  const [loading,setLoading]=useState(false);
  const {toast,ToastContainer}=useToast();
  return(
    <>
    <ToastContainer/>
    <button onClick={async()=>{
      setLoading(true);
      try{
        await api.completeOrder(order.id);
        setOrders(orders.map(o=>o.id===order.id?{...o,status:"completed",completedAt:new Date().toLocaleDateString("ru")}:o));
      }catch(e){toast(e.message||"Ошибка при обновлении заказа","error");}
      setLoading(false);
    }} disabled={loading}
      style={{background:"#16a34a",color:"#fff",border:"none",borderRadius:8,
        padding:"10px 16px",fontSize:13,cursor:loading?"not-allowed":"pointer",fontWeight:600,
        minHeight:44,width:m?"100%":undefined,opacity:loading?0.7:1}}>
      {loading?"Сохранение...":"Отметить выполненным"}
    </button>
    </>
  );
}

function OrdersPage({currentUser,orders,setOrders,ratings}){
  const m=useIsMobile();
  // Orders are already filtered by the API for the current user
  const myOrders=orders;

  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:m?"14px":"32px 16px"}}>
      <h2 style={{margin:`0 0 ${m?16:24}px`,fontSize:m?18:22,fontWeight:800,color:"#111"}}>История заказов</h2>
      {myOrders.length===0?(
        <div style={{background:"#fff",borderRadius:20,padding:"60px 20px",textAlign:"center",
          boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          <ClipboardList size={40} color="#d1d5db" style={{marginBottom:12}}/>
          <div style={{fontSize:15,color:"#9ca3af"}}>Заказов пока нет</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {myOrders.map(order=>{
            const wRating=avgRating(order.workerId,ratings);
            const myRating=ratings.find(r=>r.orderId===order.id&&r.employerId===currentUser.id);
            return(
              <div key={order.id} style={{background:"#fff",borderRadius:m?12:16,padding:m?"14px 16px":"20px 24px",
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:"#111"}}>
                      {currentUser.role==="employer"?order.workerName:order.employerName}
                    </div>
                    <div style={{color:"#9ca3af",fontSize:13,marginTop:2}}>
                      {currentUser.role==="employer"?order.workerProfession:"Заказчик"}
                    </div>
                  </div>
                  <Badge bg={order.status==="completed"?"#f0fdf4":"#fffbeb"}
                    color={order.status==="completed"?"#16a34a":"#d97706"}>
                    {order.status==="completed"?"Выполнен":"В процессе"}
                  </Badge>
                </div>
                <div style={{background:"#F5F8FB",borderRadius:10,padding:"11px 14px",marginBottom:10,fontSize:13}}>
                  {currentUser.role==="employer"?(
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,color:"#374151"}}>
                        <Lock size={12} color="#9ca3af"/>
                        Контакт через платформу AbhJob
                      </div>
                      {wRating!==null&&<Stars score={wRating}/>}
                      {myRating&&<div style={{fontSize:12,color:"#9ca3af"}}>
                        Ваша оценка: {"★".repeat(myRating.score)}{"☆".repeat(5-myRating.score)}
                      </div>}
                    </div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <div style={{color:"#374151"}}>👤 <strong>{order.employerName}</strong></div>
                      <div style={{display:"flex",alignItems:"center",gap:6,color:"#374151"}}>
                        <Lock size={12} color="#9ca3af"/>Контакт через платформу
                      </div>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",
                  flexDirection:m?"column":"row",gap:m?8:0,alignItems:m?"flex-start":"center"}}>
                  <span style={{fontSize:12,color:"#9ca3af"}}>
                    Создан: {order.createdAt}
                    {order.completedAt&&` · Выполнен: ${order.completedAt}`}
                  </span>
                  {order.status==="active"&&currentUser.role==="employer"&&(
                    <CompleteOrderButton order={order} orders={orders} setOrders={setOrders} m={m}/>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FAQ PAGE ─────────────────────────────────────────────────────────────────

function FaqPage({onNav}){
  const m=useIsMobile();
  const [open,setOpen]=useState(null);
  const renderAnswer=a=>{
    if(typeof a==="string") return a;
    return a.map((part,i)=>{
      if(typeof part==="string") return <span key={i}>{part}</span>;
      return(
        <span key={i}
          onClick={()=>onNav&&onNav(part.key)}
          style={{color:"#2563eb",fontWeight:700,cursor:"pointer",
            textDecoration:"underline",textDecorationStyle:"dotted",
            textUnderlineOffset:3}}>
          {part.text}
        </span>
      );
    });
  };
  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:m?"14px":"32px 16px"}}>
      <h2 style={{margin:"0 0 6px",fontSize:22,fontWeight:800,color:"#111"}}>Вопросы и ответы</h2>
      <p style={{margin:"0 0 24px",color:"#9ca3af",fontSize:14}}>Популярные вопросы о сайте</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {FAQ_ITEMS.map((item,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,overflow:"hidden",
            border:"1px solid #f3f4f6",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{
              width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"16px 20px",border:"none",background:"none",cursor:"pointer",
              fontFamily:"inherit",textAlign:"left"}}>
              <span style={{fontWeight:700,fontSize:14,color:"#111"}}>{item.q}</span>
              {open===i?<ChevronUp size={18} color="#9ca3af"/>:<ChevronDown size={18} color="#9ca3af"/>}
            </button>
            {open===i&&<div style={{padding:"0 20px 16px",fontSize:14,color:"#4b5563",lineHeight:1.7}}>
              {renderAnswer(item.a)}
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PRIVACY POLICY PAGE ──────────────────────────────────────────────────────

function PrivacyPage(){
  const m=useIsMobile();
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:m?"14px":"32px 16px"}}>
      <div style={{background:"#fff",borderRadius:m?14:20,padding:m?"20px":"36px 40px",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <Shield size={24} color="#2563eb"/>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#111"}}>Политика конфиденциальности</h1>
        </div>
        <p style={{color:"#9ca3af",fontSize:13,marginTop:-16,marginBottom:24}}>
          Последнее обновление: {new Date().toLocaleDateString("ru")}
        </p>
        {[
          {title:"1. Общие положения",
           text:"Настоящая политика конфиденциальности регулирует порядок обработки и защиты персональных данных пользователей сервиса AbhJob (abhjob.ru). Используя сайт, вы соглашаетесь с условиями данной политики."},
          {title:"2. Какие данные мы собираем",
           text:"Мы собираем следующие данные: имя и фамилия, номер телефона, пароль (хранится в зашифрованном виде), сведения о профессиональной деятельности (для работников), история заказов и взаимодействий на платформе."},
          {title:"3. Как мы используем данные",
           text:"Данные используются исключительно для: обеспечения работы платформы, связи между работниками и работодателями через диспетчера AbhJob, улучшения качества сервиса, и формирования аналитической отчётности в обезличенном виде."},
          {title:"4. Передача данных третьим лицам",
           text:"Мы не передаём ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством. Контактные данные работников не раскрываются напрямую — связь осуществляется через платформу."},
          {title:"5. Защита данных",
           text:"Мы принимаем технические и организационные меры для защиты ваших данных: шифрование передаваемых данных (HTTPS), ограниченный доступ к персональным данным, регулярное резервное копирование."},
          {title:"6. Ваши права",
           text:"Вы вправе запросить доступ к своим данным, исправление неточных данных, удаление аккаунта и всех связанных данных. Для этого обратитесь к нам через форму обратной связи или единый номер платформы."},
          {title:"7. Cookies",
           text:"Сайт использует cookies для корректной работы сессий авторизации. Отключение cookies в браузере может повлиять на работоспособность сайта."},
          {title:"8. Контакты",
           text:"По вопросам конфиденциальности обращайтесь: abhjob.ru | Абхазия, Сухум"},
        ].map(({title,text})=>(
          <div key={title} style={{marginBottom:20}}>
            <h3 style={{margin:"0 0 8px",fontSize:15,fontWeight:700,color:"#111"}}>{title}</h3>
            <p style={{margin:0,fontSize:14,color:"#4b5563",lineHeight:1.7}}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────

function TermsPage(){
  const m=useIsMobile();
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:m?"14px":"32px 16px"}}>
      <div style={{background:"#fff",borderRadius:m?14:20,padding:m?"20px":"36px 40px",
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
          <FileText size={24} color="#2563eb"/>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#111"}}>Пользовательское соглашение</h1>
        </div>
        <p style={{color:"#9ca3af",fontSize:13,marginTop:-16,marginBottom:24}}>
          Последнее обновление: {new Date().toLocaleDateString("ru")}
        </p>
        {[
          {title:"1. Предмет соглашения",
           text:"Настоящее соглашение регулирует использование платформы AbhJob — сервиса для поиска специалистов в Абхазии. Регистрируясь на сайте, вы принимаете все условия данного соглашения."},
          {title:"2. Правила размещения анкет",
           text:"Запрещается: размещать недостоверную информацию, публиковать контактные данные третьих лиц без их согласия, использовать нецензурные выражения или оскорбительный контент, размещать анкеты с чужими фотографиями. Все анкеты проходят модерацию перед публикацией."},
          {title:"3. Запрет обхода платформы",
           text:"Пользователи обязуются осуществлять все расчёты через платформу AbhJob. Попытка договориться об оплате в обход платформы является нарушением соглашения и влечёт блокировку аккаунта без возможности восстановления."},
          {title:"4. Комиссия платформы",
           text:"За каждую успешно завершённую сделку платформа взимает комиссию в размере 7% от стоимости услуги. Комиссия удерживается в момент проведения оплаты. Работник получает 93% от согласованной суммы."},
          {title:"5. Верификация работников",
           text:"Для получения статуса «Проверен» работник обязан лично явиться в офис AbhJob с документом, удостоверяющим личность. Предоставление поддельных документов является основанием для немедленной блокировки и передачи данных в соответствующие органы."},
          {title:"6. Ответственность сторон",
           text:"AbhJob является информационным посредником и не несёт ответственности за качество услуг, оказываемых работниками. Платформа не гарантирует непрерывность работы сервиса, однако обязуется уведомлять пользователей о плановых технических работах."},
          {title:"7. Блокировка аккаунта",
           text:"Платформа вправе заблокировать аккаунт без предупреждения при нарушении правил: обход платформы при расчётах, размещение запрещённого контента, систематические жалобы от других пользователей."},
          {title:"8. Изменение условий",
           text:"AbhJob оставляет за собой право изменять условия соглашения. Актуальная версия всегда доступна на странице soглашения. Продолжение использования сервиса после изменений означает согласие с новыми условиями."},
        ].map(({title,text})=>(
          <div key={title} style={{marginBottom:20}}>
            <h3 style={{margin:"0 0 8px",fontSize:15,fontWeight:700,color:"#111"}}>{title}</h3>
            <p style={{margin:0,fontSize:14,color:"#4b5563",lineHeight:1.7}}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SERVICES PICKER ──────────────────────────────────────────────────────────

function ServicesPicker({services,onChange}){
  const empty={id:uid(),name:"",from:"",to:"",negotiable:false};
  const add=()=>onChange([...services,{...empty,id:uid()}]);
  const remove=id=>onChange(services.filter(s=>s.id!==id));
  const upd=(id,key,val)=>onChange(services.map(s=>s.id===id?{...s,[key]:val}:s));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>Оказываемые услуги</label>
        <button type="button" onClick={add} style={{
          background:"#eff6ff",border:"none",borderRadius:8,padding:"5px 12px",
          fontSize:12,color:"#2563eb",cursor:"pointer",fontWeight:700}}>
          + Добавить
        </button>
      </div>
      {services.length===0&&(
        <div style={{fontSize:12,color:"#9ca3af",padding:"8px 0"}}>
          Не указано — нажмите «Добавить» чтобы перечислить услуги
        </div>
      )}
      {services.map(s=>(
        <div key={s.id} style={{background:"#F5F8FB",borderRadius:10,padding:"12px",
          border:"1px solid #f3f4f6",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input value={s.name} onChange={e=>upd(s.id,"name",e.target.value)}
              placeholder="Название услуги" style={{flex:1,border:"1.5px solid #e5e7eb",
                borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"inherit",
                outline:"none",background:"#fff"}}/>
            <button type="button" onClick={()=>remove(s.id)} style={{
              background:"none",border:"none",cursor:"pointer",color:"#dc2626",
              fontSize:18,lineHeight:1,padding:"0 4px",flexShrink:0}}>×</button>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <input type="number" value={s.from||""} disabled={s.negotiable}
              onChange={e=>upd(s.id,"from",e.target.value?Number(e.target.value):null)}
              placeholder="От ₽" style={{width:90,border:"1.5px solid #e5e7eb",
                borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",
                outline:"none",background:s.negotiable?"#f3f4f6":"#fff",color:"#111"}}/>
            <span style={{color:"#9ca3af",fontSize:12}}>—</span>
            <input type="number" value={s.to||""} disabled={s.negotiable}
              onChange={e=>upd(s.id,"to",e.target.value?Number(e.target.value):null)}
              placeholder="До ₽" style={{width:90,border:"1.5px solid #e5e7eb",
                borderRadius:8,padding:"7px 10px",fontSize:13,fontFamily:"inherit",
                outline:"none",background:s.negotiable?"#f3f4f6":"#fff",color:"#111"}}/>
            <button type="button" onClick={()=>upd(s.id,"negotiable",!s.negotiable)} style={{
              padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,
              border:s.negotiable?"none":"1.5px solid #e5e7eb",
              background:s.negotiable?"#111827":"#fff",
              color:s.negotiable?"#fff":"#374151",transition:"all 0.15s",whiteSpace:"nowrap"}}>
              Договорная
            </button>
          </div>
          {/* Preview */}
          {(s.name||s.from||s.to||s.negotiable)&&(
            <div style={{fontSize:11,color:"#9ca3af"}}>
              Отобразится как: <strong style={{color:"#374151"}}>{s.name||"Услуга"}</strong>
              {" — "}<span style={{color:"#16a34a",fontWeight:600}}>
                {s.negotiable?"Договорная":
                 s.from&&s.to?`от ${Number(s.from).toLocaleString("ru")} до ${Number(s.to).toLocaleString("ru")} ₽`:
                 s.from?`от ${Number(s.from).toLocaleString("ru")} ₽`:
                 s.to?`до ${Number(s.to).toLocaleString("ru")} ₽`:"не указана"}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WORKER FORM ──────────────────────────────────────────────────────────────

function WorkerForm({onClose,onAdd,currentUser}){
  const m=useIsMobile();
  const [f,setF]=useState({
    name:currentUser.name||"",category:"",gender:"",profession:"",
    experience:"",city:"",age:"",salary:"",salaryNum:"",
    travelCities:[],skills:"",about:"",
    phone:currentUser.phone||"+7940",email:"",photo:null,services:[],
  });
  const [err,setErr]=useState({});
  const [submitting,setSubmitting]=useState(false);
  const upd=k=>v=>{setF({...f,[k]:v});setErr({...err,[k]:""});};

  const submit=async()=>{
    const e={};
    if(!f.name.trim())e.name="Введите имя";
    if(checkText(f.name,f.profession,f.about,f.skills))
      e.name="Анкета содержит недопустимые слова";
    if(!f.category)e.category="Выберите категорию";
    if(!f.gender)e.gender="Укажите пол";
    if(!f.profession.trim())e.profession="Укажите профессию";
    if(!f.experience.trim())e.experience="Укажите опыт";
    if(!f.city.trim())e.city="Укажите город";
    if(!f.salary.trim())e.salary="Укажите зарплату";
    if(!f.phone.trim())e.phone="Введите телефон";
    if(Object.keys(e).length){setErr(e);return;}
    const salaryNum=parseInt((f.salary||"").replace(/\D/g,""))||0;
    setSubmitting(true);
    try{
      const wRes=await api.createWorker({
        name:f.name,phone:f.phone,category:f.category,profession:f.profession,
        gender:f.gender,experience:f.experience,city:f.city,
        travel_cities:f.travelCities,age:parseInt(f.age)||0,
        salary:f.salary,salary_num:salaryNum,
        skills:f.skills,about:f.about,photo:f.photo||null,
        services:(f.services||[]).map(s=>({name:s.name,from:s.from,to:s.to,negotiable:s.negotiable||false})),
      });
      onAdd(mapWorker(wRes));
    }catch(ex){
      setErr({name:ex.message||"Ошибка создания анкеты"});
    }finally{setSubmitting(false);}
  };

  return(
    <Overlay onClose={onClose} maxWidth={560}>
      <h2 style={{margin:"0 0 22px",fontSize:20,fontWeight:800,paddingRight:24,color:"#111"}}>
        Анкета работника
      </h2>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <PhotoUpload value={f.photo} onChange={v=>setF({...f,photo:v})}/>

        <Inp label="Имя и фамилия" value={f.name}
          onChange={e=>upd("name")(e.target.value)} placeholder="Иван Иванов"
          error={err.name} required/>

        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
            Категория <span style={{color:"#dc2626"}}>*</span>
          </label>
          <select value={f.category} onChange={e=>upd("category")(e.target.value)}
            style={{border:`1.5px solid ${err.category?"#dc2626":"#e5e7eb"}`,
              borderRadius:10,padding:"10px 14px",fontSize:14,fontFamily:"inherit",
              background:"#fff",color:"#111",outline:"none"}}>
            <option value="">— Выберите категорию —</option>
            {CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}
          </select>
          {err.category&&<span style={{fontSize:12,color:"#dc2626"}}>{err.category}</span>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>
            Пол <span style={{color:"#dc2626"}}>*</span>
          </label>
          <div style={{display:"flex",gap:8}}>
            {[{val:"м",label:"Мужской"},{val:"ж",label:"Женский"}].map(g=>(
              <button key={g.val} type="button" onClick={()=>upd("gender")(g.val)} style={{
                flex:1,padding:"9px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                border:f.gender===g.val?"none":"1.5px solid #e5e7eb",
                background:f.gender===g.val?"#111827":"#fff",
                color:f.gender===g.val?"#fff":"#374151",transition:"all 0.15s"}}>
                {g.label}
              </button>
            ))}
          </div>
          {err.gender&&<span style={{fontSize:12,color:"#dc2626"}}>{err.gender}</span>}
        </div>

        <Inp label="Профессия / специальность" value={f.profession}
          onChange={e=>upd("profession")(e.target.value)}
          placeholder="Сварщик, повар, дизайнер..." error={err.profession} required
          hint="Чем точнее — тем лучше вас найдут"/>

        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"1fr 1fr",gap:12}}>
          <Inp label="Опыт работы" value={f.experience}
            onChange={e=>upd("experience")(e.target.value)} placeholder="5 лет"
            error={err.experience} required/>
          <Inp label="Возраст" value={f.age}
            onChange={e=>upd("age")(e.target.value)} placeholder="30" type="number"/>
        </div>
        <Inp label="Ваш город" value={f.city}
          onChange={e=>upd("city")(e.target.value)} placeholder="Сухум, Гагра..."
          error={err.city} required/>
        <Inp label="Ожидаемая оплата" value={f.salary}
          onChange={e=>upd("salary")(e.target.value)} placeholder="80 000 ₽"
          error={err.salary} required/>

        <div style={{background:"#F5F8FB",borderRadius:12,padding:"14px",border:"1px solid #f3f4f6"}}>
          <CityPicker selected={f.travelCities} onChange={v=>upd("travelCities")(v)}/>
        </div>
        <Inp label="Навыки" value={f.skills}
          onChange={e=>upd("skills")(e.target.value)} placeholder="Через запятую"/>

        <div style={{background:"#F5F8FB",borderRadius:12,padding:"14px",border:"1px solid #f3f4f6"}}>
          <ServicesPicker services={f.services} onChange={v=>setF({...f,services:v})}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>О себе</label>
          <textarea value={f.about} onChange={e=>upd("about")(e.target.value)}
            placeholder="Расскажите о себе, опыте, условиях работы..." rows={3}
            style={{border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",
              fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none"}}/>
        </div>
        <Inp label="Телефон" value={f.phone}
          onChange={e=>upd("phone")(e.target.value)} placeholder="+7940..."
          type="text" error={err.phone} required
          hint="Будет скрыт от пользователей — связь через платформу"/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button onClick={onClose} style={{flex:1,border:"1px solid #e5e7eb",background:"#fff",
          borderRadius:10,padding:"11px",fontSize:14,cursor:"pointer",color:"#374151"}}>
          Отмена
        </button>
        <button onClick={submit} disabled={submitting} style={{flex:2,background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",border:"none",
          borderRadius:10,padding:"11px",fontSize:14,cursor:submitting?"not-allowed":"pointer",fontWeight:700,opacity:submitting?0.7:1}}>
          {submitting?"Сохранение...":"Разместить анкету"}
        </button>
      </div>
    </Overlay>
  );
}

// ─── CONTACT MODAL ────────────────────────────────────────────────────────────

function ContactModal({worker,currentUser,onClose,onOrderCreated,onNeedAuth}){
  if(!currentUser){
    return(
      <Overlay onClose={onClose} maxWidth={360}>
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <Lock size={36} color="#9ca3af" style={{marginBottom:16}}/>
          <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:800,color:"#111"}}>
            Войдите чтобы связаться
          </h3>
          <p style={{margin:"0 0 24px",fontSize:14,color:"#6b7280",lineHeight:1.6}}>
            Контакты работников доступны только зарегистрированным пользователям
          </p>
          <button onClick={onNeedAuth} style={{width:"100%",background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",
            border:"none",borderRadius:10,padding:"12px",fontSize:15,cursor:"pointer",fontWeight:700,marginBottom:8}}>
            Войти / Зарегистрироваться
          </button>
          <button onClick={onClose} style={{width:"100%",border:"1px solid #e5e7eb",background:"#fff",
            borderRadius:10,padding:"10px",fontSize:14,cursor:"pointer",color:"#9ca3af"}}>
            Закрыть
          </button>
        </div>
      </Overlay>
    );
  }

  const handle=()=>{
    onOrderCreated(worker.id);
    onClose();
  };

  return(
    <Overlay onClose={onClose} maxWidth={380}>
      <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:800,paddingRight:24,color:"#111"}}>
        Связаться с работником
      </h3>
      <p style={{margin:"0 0 20px",color:"#9ca3af",fontSize:13}}>{worker.name} · {worker.profession}</p>

      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,
        padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <Shield size={15} color="#16a34a"/>
          <span style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>Безопасный контакт через AbhJob</span>
        </div>
        <p style={{margin:0,fontSize:13,color:"#4b5563",lineHeight:1.6}}>
          Контакт происходит через нашу платформу. Реальный номер работника скрыт — это защищает обе стороны и гарантирует безопасность сделки.
        </p>
      </div>

      <div style={{background:"#F5F8FB",borderRadius:10,padding:"12px 16px",marginBottom:20,
        display:"flex",alignItems:"center",gap:10}}>
        <Phone size={16} color="#6b7280"/>
        <div>
          <div style={{fontSize:12,color:"#9ca3af"}}>Единый номер AbhJob</div>
          <div style={{fontSize:16,fontWeight:700,color:"#111"}}>Скоро появится</div>
        </div>
      </div>

      {currentUser.role==="employer"&&(
        <button onClick={handle} style={{width:"100%",background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",
          border:"none",borderRadius:10,padding:"12px",fontSize:14,cursor:"pointer",fontWeight:700,marginBottom:8}}>
          Сохранить в историю заказов
        </button>
      )}
      <button onClick={onClose} style={{width:"100%",border:"1px solid #e5e7eb",background:"#fff",
        borderRadius:10,padding:"10px",fontSize:14,cursor:"pointer",color:"#9ca3af"}}>
        Закрыть
      </button>
    </Overlay>
  );
}

// ─── WORKER CARD ─────────────────────────────────────────────────────────────

function WorkerCard({worker,index,onContact,ratings,isFav,onToggleFav}){
  const [exp,setExp]=useState(false);
  const [copied,setCopied]=useState(false);
  const m=useIsMobile();
  const rating=avgRating(worker.id,ratings);
  const rCount=ratings.filter(r=>r.workerId===worker.id).length;
  const cat=CATEGORIES.find(c=>c.label===worker.category);
  const CatIcon=cat?.Icon;

  return(
    <div
      style={{background:"#fff",border:"1px solid #f3f4f6",borderRadius:m?12:16,padding:m?"14px":"20px",
      display:"flex",flexDirection:"column",gap:m?10:12,
      boxShadow:"0 1px 4px rgba(0,0,0,0.04)",transition:"all 0.2s",
      animationDelay:`${Math.min(index*0.07,0.5)}s`}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.09)";e.currentTarget.style.transform="translateY(-3px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)";e.currentTarget.style.transform="translateY(0)";}}>

      {/* Top row */}
      <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
        <Avatar name={worker.name} photo={worker.photo&&worker.photoApproved?worker.photo:null} index={index}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:15,color:"#111"}}>{worker.name}</span>
              {onToggleFav&&(
                <button onClick={e=>{e.stopPropagation();onToggleFav(worker.id);}}
                  title={isFav?"Убрать из избранного":"Добавить в избранное"}
                  style={{background:"none",border:"none",cursor:"pointer",padding:"2px",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"transform 0.15s",flexShrink:0}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  <Heart size={20} color="#16a34a" fill={isFav?"#16a34a":"none"} strokeWidth={2}/>
                </button>
              )}
              {worker.verified&&(
                <span title="Личность подтверждена в офисе AbhJob"
                  style={{display:"inline-flex",alignItems:"center",gap:4,
                    background:"#eff6ff",color:"#2563eb",borderRadius:20,
                    padding:"3px 10px",fontSize:13,fontWeight:700,cursor:"help"}}>
                  <CheckCircle size={13}/>Проверен
                </span>
              )}
            </div>
            {rating!==null&&(
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <Stars score={rating}/>
                <span style={{fontSize:11,color:"#9ca3af"}}>({rCount})</span>
              </div>
            )}
          </div>
          <div style={{color:"#374151",fontSize:15,fontWeight:700,marginTop:3,lineHeight:1.3}}>
            {worker.profession}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",marginTop:5}}>
            <span style={{fontSize:12,color:"#9ca3af",display:"flex",alignItems:"center",gap:3}}>
              <MapPin size={11}/>{worker.city}
            </span>
            <span style={{fontSize:12,color:"#9ca3af",display:"flex",alignItems:"center",gap:3}}>
              <Clock size={11}/>{worker.experience}
            </span>
            {worker.age&&<span style={{fontSize:12,color:"#9ca3af"}}>{worker.age} лет</span>}
          </div>
        </div>
      </div>

      {/* Category */}
      <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:8}}>
        {CatIcon&&(
          <Badge bg="#f8faff" color="#4b72c0">
            <CatIcon size={11} strokeWidth={2}/>{worker.category}
          </Badge>
        )}
      </div>

      {/* Travel cities */}
      {worker.travelCities?.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#9ca3af"}}>Выезд:</span>
          {worker.travelCities.map(c=>(
            <Badge key={c} bg="#f0fdf4" color="#16a34a" style={{fontSize:11,padding:"2px 8px"}}>
              {c}
            </Badge>
          ))}
        </div>
      )}

      {/* Skills */}
      {worker.skills&&(
        <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>
          <span style={{fontWeight:600}}>Навыки: </span>{worker.skills}
        </div>
      )}

      {/* Services */}
      {worker.services?.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:0,
          border:"1px solid #f3f4f6",borderRadius:10,overflow:"hidden"}}>
          {worker.services.map((svc,i)=>(
            <div key={svc.id} style={{
              display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"8px 12px",gap:10,
              background:i%2===0?"#fafafa":"#fff",
              borderBottom:i<worker.services.length-1?"1px solid #f3f4f6":"none"}}>
              <span style={{fontSize:13,color:"#374151",fontWeight:500,minWidth:0,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {svc.name}
              </span>
              <span style={{
                fontSize:12,fontWeight:700,flexShrink:0,
                color:svc.negotiable?"#6b7280":"#16a34a",
                background:svc.negotiable?"#f3f4f6":"#f0fdf4",
                borderRadius:20,padding:"3px 10px",whiteSpace:"nowrap"}}>
                {fmtPrice(svc)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* About (expandable) */}
      {exp&&worker.about&&(
        <div style={{fontSize:13,color:"#4b5563",background:"#F5F8FB",borderRadius:10,
          padding:"10px 14px",lineHeight:1.6}}>{worker.about}</div>
      )}

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginTop:2}}>
        {worker.about&&(
          <button onClick={()=>setExp(!exp)} style={{border:"1px solid #e5e7eb",background:"#fff",
            borderRadius:8,padding:m?"10px 14px":"7px 14px",fontSize:m?13:12,cursor:"pointer",color:"#6b7280",
            fontWeight:600,display:"flex",alignItems:"center",gap:4,minHeight:44}}>
            {exp?<><ChevronUp size={13}/>Скрыть</>:<><ChevronDown size={13}/>Подробнее</>}
          </button>
        )}
        <button onClick={()=>{
          const text=`${worker.name} — ${worker.profession} (${worker.city})\nAbhJob: ${window.location.href}`;
          if(navigator.share){navigator.share({title:worker.name,text});}
          else{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}
        }} style={{border:"1px solid #e5e7eb",background:"#fff",borderRadius:8,
          padding:m?"10px 12px":"7px 12px",cursor:"pointer",color:copied?"#16a34a":"#6b7280",
          display:"flex",alignItems:"center",justifyContent:"center",gap:4,minHeight:44}}
          title="Поделиться анкетой">
          {copied?<><Check size={14}/>Скопировано</>:<Share2 size={14}/>}
        </button>
        <button onClick={()=>onContact(worker)} style={{
          flex:1,background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",border:"none",borderRadius:8,
          padding:m?"10px 16px":"8px 16px",fontSize:m?14:13,cursor:"pointer",fontWeight:600,
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:44}}>
          <Phone size={14}/>Связаться
        </button>
      </div>
    </div>
  );
}

// ─── HERO CANVAS ANIMATION ────────────────────────────────────────────────────
function HeroCanvas(){
  const ref=useRef(null);
  useEffect(()=>{
    const cvs=ref.current;
    if(!cvs) return;
    const ctx=cvs.getContext('2d');
    let t=0,W=0,H=0,waveTop=0,raf=null;
    const resize=()=>{
      const hero=cvs.parentElement;
      W=hero.offsetWidth; H=hero.offsetHeight;
      cvs.width=W; cvs.height=H;
      waveTop=H*0.82;
    };
    const wY=x=>{
      const base=waveTop+(H-waveTop)*0.3;
      const amp=8+(x/W)*14;
      return base+amp*Math.sin((x/W)*Math.PI*3-t)
                +(amp*.4)*Math.sin((x/W)*Math.PI*6-t*1.8)
                -(x/W)*18;
    };
    const frame=()=>{
      t+=0.04;
      ctx.clearRect(0,0,W,H);

      // ── Вариант 4: тонкие лучи + большой ореол ──
      // Большой мягкий ореол
      const hR=W*0.75;
      const hg=ctx.createRadialGradient(W,0,hR*0.1,W,0,hR);
      const hp=0.7+0.3*Math.sin(t*0.8);
      hg.addColorStop(0,`rgba(255,255,210,${0.38*hp})`);
      hg.addColorStop(0.5,`rgba(255,248,180,${0.18*hp})`);
      hg.addColorStop(1,'rgba(255,248,180,0)');
      ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);

      // 20 тонких лучей — каждый мерцает независимо
      for(let i=0;i<20;i++){
        const ang=Math.PI*(0.48+i*0.036);
        const pulse=0.6+0.4*Math.sin(t*(0.9+i*0.08)+i*0.6);
        const ww=3+Math.sin(i*1.3)*2;
        const aa=0.16+Math.sin(i*0.9)*0.08;
        ctx.save();
        ctx.translate(W,0); ctx.rotate(ang);
        const len=Math.sqrt(W*W+H*H);
        const g=ctx.createLinearGradient(0,0,0,len);
        g.addColorStop(0,`rgba(255,255,220,${aa*pulse})`);
        g.addColorStop(0.4,`rgba(255,255,210,${aa*0.4*pulse})`);
        g.addColorStop(1,'rgba(255,255,210,0)');
        ctx.fillStyle=g; ctx.fillRect(-ww/2,0,ww,len);
        ctx.restore();
      }

      // Яркая точка-источник в правом верхнем углу
      const pt=ctx.createRadialGradient(W,0,0,W,0,120);
      const pp=0.85+0.15*Math.sin(t*1.5);
      pt.addColorStop(0,`rgba(255,255,240,${0.75*pp})`);
      pt.addColorStop(0.4,`rgba(255,255,220,${0.30*pp})`);
      pt.addColorStop(1,'rgba(255,255,220,0)');
      ctx.fillStyle=pt; ctx.fillRect(0,0,W,H);

      // 5 длинных выраженных лучей разной длины
      const longRays=[
        {ang:Math.PI*0.52, w:6,  maxLen:W*1.1, a:0.22, phase:0.0},
        {ang:Math.PI*0.58, w:4,  maxLen:W*0.8, a:0.18, phase:1.2},
        {ang:Math.PI*0.64, w:8,  maxLen:W*1.3, a:0.20, phase:2.1},
        {ang:Math.PI*0.70, w:3,  maxLen:W*0.6, a:0.16, phase:0.8},
        {ang:Math.PI*0.76, w:5,  maxLen:W*1.0, a:0.19, phase:1.7},
      ];
      longRays.forEach(r=>{
        const pulse=0.7+0.3*Math.sin(t*0.7+r.phase);
        ctx.save();
        ctx.translate(W,0); ctx.rotate(r.ang);
        const g=ctx.createLinearGradient(0,0,0,r.maxLen);
        g.addColorStop(0,`rgba(255,252,200,${r.a*pulse})`);
        g.addColorStop(0.6,`rgba(255,248,180,${r.a*0.3*pulse})`);
        g.addColorStop(1,'rgba(255,248,180,0)');
        ctx.fillStyle=g;
        ctx.fillRect(-r.w/2,0,r.w,r.maxLen);
        ctx.restore();
      });

      // ── Волна ──
      ctx.beginPath();
      for(let x=0;x<=W;x+=2){const y=wY(x);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      const gw=ctx.createLinearGradient(0,waveTop,0,H);
      gw.addColorStop(0,'rgba(255,255,255,.30)');
      gw.addColorStop(0.5,'rgba(255,255,255,.15)');
      gw.addColorStop(1,'rgba(255,255,255,.05)');
      ctx.fillStyle=gw; ctx.fill();

      // Гребень
      ctx.beginPath();
      for(let x=0;x<=W;x+=2){const y=wY(x);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(255,255,255,.88)'; ctx.lineWidth=2; ctx.stroke();

      // Пузырьки пены
      for(let x=10;x<W-10;x+=24){
        const y=wY(x); const r=1+Math.sin(x*.5+t*3)*.8;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fill();
      }
      raf=requestAnimationFrame(frame);
    };
    resize();
    setTimeout(()=>{resize();frame();},100);
    window.addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);
  return(
    <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",
      pointerEvents:"none",zIndex:1}}/>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage({onNavigate,workerCount,onSearch}){
  const m=useIsMobile();
  const [q,setQ]=useState("");
  const go=()=>onSearch(q);
  return(
    <div style={{maxWidth:1080,margin:"0 auto",padding:m?"16px":"32px 16px"}}>

      {/* Hero */}
      <div style={{borderRadius:m?16:24,overflow:"hidden",marginBottom:m?14:24,
        background:"linear-gradient(to top right,#0c4a6e 0%,#0369a1 35%,#0ea5e9 70%,#38bdf8 100%)",
        padding:m?"28px 20px 88px":"52px 48px 100px",position:"relative"}}>
        <HeroCanvas/>
        <div style={{position:"relative",zIndex:2}}>
          {/* Счётчик — в потоке, над заголовком */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:10}}>
            <CheckCircle size={13} color="#4ade80"/>
            <span style={{fontSize:13,color:"rgba(255,255,255,0.9)",fontWeight:700}}>
              {workerCount} специалистов
            </span>
          </div>
          <h1 style={{margin:`0 0 10px`,fontSize:m?22:38,fontWeight:900,color:"#fff",lineHeight:1.2}}>
            Найдите нужного специалиста в Абхазии
          </h1>
          <p style={{margin:`0 0 ${m?20:28}px`,fontSize:m?13:16,color:"rgba(255,255,255,0.65)",lineHeight:1.6}}>
            Мастера, строители, водители, повара и другие — рядом с вами
          </p>
          {/* ── Строка поиска — на всю ширину ── */}
          <div style={{display:"flex",background:"#fff",borderRadius:m?14:16,
            overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.25)"}}>
            <input
              type="text"
              value={q}
              onChange={e=>setQ(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&go()}
              placeholder="Найти специалиста..."
              style={{flex:1,border:"none",outline:"none",
                padding:m?"13px 16px":"16px 22px",
                fontSize:m?14:16,color:"#111",fontFamily:"inherit",
                background:"transparent",minWidth:0}}
            />
            <button onClick={go} style={{
              flexShrink:0,background:"transparent",border:"none",cursor:"pointer",
              padding:m?"0 16px":"0 20px",
              display:"flex",alignItems:"center",justifyContent:"center",
              borderLeft:"1.5px solid #e5e7eb"}}
              onMouseEnter={e=>e.currentTarget.querySelector("svg").style.color="#111"}
              onMouseLeave={e=>e.currentTarget.querySelector("svg").style.color="#0ea5e9"}>
              <Search size={m?20:22} color="#0ea5e9" strokeWidth={2.5}/>
            </button>
          </div>
        </div>
      </div>

      {/* Ad banner */}
      <div style={{background:"#fff",borderRadius:m?12:16,border:"1.5px dashed #e5e7eb",
        padding:m?"16px":"36px 20px",textAlign:"center",marginBottom:m?14:24,
        boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#d1d5db",letterSpacing:"0.1em",
          textTransform:"uppercase",marginBottom:4}}>Реклама</div>
        <div style={{fontWeight:600,fontSize:m?13:15,color:"#9ca3af"}}>
          Место для вашего рекламного баннера
        </div>
        <div style={{fontSize:11,color:"#d1d5db",marginTop:3}}>{m?"320 × 50":"728 × 90"} · Свяжитесь с нами</div>
      </div>

      {/* Categories */}
      <div style={{marginBottom:m?14:24}}>
        <h2 style={{margin:`0 0 ${m?12:16}px`,fontSize:m?16:18,fontWeight:800,color:"#111"}}>Категории услуг</h2>
        <div style={{display:"grid",
          gridTemplateColumns:m?"repeat(auto-fill,minmax(100px,1fr))":"repeat(auto-fill,minmax(140px,1fr))",gap:m?8:8}}>
          {CATEGORIES.map(({Icon,label})=>(
            <button key={label} onClick={()=>onNavigate("catalog")} style={{
              background:"#fff",border:"1px solid #f3f4f6",borderRadius:12,
              padding:m?"14px 8px":"20px 12px",cursor:"pointer",textAlign:"center",
              boxShadow:"0 1px 3px rgba(0,0,0,0.04)",transition:"all 0.18s",
              fontFamily:"inherit",display:"flex",flexDirection:"column",
              alignItems:"center",gap:m?8:12}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(37,99,235,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#f3f4f6";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)";}}>
              <div style={{width:m?48:56,height:m?48:56,borderRadius:14,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon size={m?28:32} color="#0ea5e9" strokeWidth={1.6}/>
              </div>
              <div style={{fontWeight:700,fontSize:m?12:13,color:"#374151",lineHeight:1.4}}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Second ad */}
      <div style={{background:"#fff",borderRadius:m?12:16,border:"1.5px dashed #e5e7eb",
        padding:m?"16px":"28px 20px",textAlign:"center",
        boxShadow:"0 1px 4px rgba(0,0,0,0.03)"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#d1d5db",letterSpacing:"0.1em",
          textTransform:"uppercase",marginBottom:4}}>Реклама</div>
        <div style={{fontWeight:600,fontSize:m?13:15,color:"#9ca3af"}}>Место для партнёрского блока</div>
        <div style={{fontSize:11,color:"#d1d5db",marginTop:3}}>{m?"320 × 100":"300 × 250"}</div>
      </div>
    </div>
  );
}

// ─── CATALOG PAGE ─────────────────────────────────────────────────────────────

const SORT_OPTIONS=[
  {key:"rating", label:"Рейтинг",  Icon:Star},
  {key:"salary", label:"Оплата",   Icon:null},
  {key:"age",    label:"Возраст",  Icon:null},
  {key:"exp",    label:"Опыт",     Icon:null},
];

function CatalogPage({workers,ratings,onContact,initialSearch="",favorites=[],onToggleFav}){
  const m=useIsMobile();
  const [search,setSearch]=useState(initialSearch);
  const [debouncedSearch,setDebouncedSearch]=useState(initialSearch);
  const [sorts,setSorts]=useState([]);
  const [cityFilters,setCityFilters]=useState([]);
  const [cityOpen,setCityOpen]=useState(false);
  const cityRef=useRef(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const t=setTimeout(()=>setDebouncedSearch(search),300);return()=>clearTimeout(t);},[search]);
  useEffect(()=>{
    const handler=e=>{if(cityRef.current&&!cityRef.current.contains(e.target))setCityOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);
  useEffect(()=>{const t=setTimeout(()=>setLoading(false),500);return()=>clearTimeout(t);},[]);

  const toggleSort=key=>{
    setSorts(prev=>{
      const ex=prev.find(s=>s.key===key);
      // Рейтинг — только по убыванию, второй клик убирает
      if(key==="rating"){
        if(!ex)return [...prev,{key,dir:"desc"}];
        return prev.filter(s=>s.key!==key);
      }
      if(!ex)return [...prev,{key,dir:"desc"}];
      if(ex.dir==="desc")return prev.map(s=>s.key===key?{...s,dir:"asc"}:s);
      return prev.filter(s=>s.key!==key);
    });
  };

  const toggleCity=city=>setCityFilters(prev=>prev.includes(city)?prev.filter(c=>c!==city):[...prev,city]);

  const filtered=useMemo(()=>workers.filter(w=>{
    if(cityFilters.length>0&&!cityFilters.some(c=>w.city===c||(w.travelCities||[]).includes(c)))return false;
    const q=debouncedSearch.toLowerCase().trim();
    if(!q)return true;
    return [w.name,w.profession,w.skills||"",w.city,w.category||"",w.about||"",
      ...(w.travelCities||[]),
      ...(w.services||[]).map(s=>s.name)]
      .some(v=>v.toLowerCase().includes(q));
  }),[workers,cityFilters,debouncedSearch]);

  const sorted=useMemo(()=>[...filtered].sort((a,b)=>{
    for(const {key,dir} of sorts){
      const mul=dir==="desc"?1:-1;
      let d=0;
      if(key==="rating"){const ra=avgRating(a.id,ratings)??-1,rb=avgRating(b.id,ratings)??-1;d=(rb-ra)*mul;}
      else if(key==="salary")d=((b.salaryNum||0)-(a.salaryNum||0))*mul;
      else if(key==="age")d=((b.age||0)-(a.age||0))*mul;
      else if(key==="exp")d=(expYears(b.experience)-expYears(a.experience))*mul;
      if(d!==0)return d;
    }
    return 0;
  }),[filtered,sorts,ratings]);

  return(
    <div style={{maxWidth:1080,margin:"0 auto",padding:m?"14px":"32px 16px"}}>

      {/* Search */}
      <div style={{position:"relative",marginBottom:12}}>
        <Search size={18} color="#9ca3af" style={{position:"absolute",left:14,
          top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
        <input type="text"
          placeholder="Поиск по услуге, профессии, навыку..."
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"13px 18px 13px 44px",fontSize:15,
            border:"1.5px solid #e5e7eb",borderRadius:14,outline:"none",
            fontFamily:"inherit",boxSizing:"border-box",background:"#fff",color:"#111"}}
          onFocus={e=>e.target.style.borderColor="#2563eb"}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
      </div>

      {/* City filter */}
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:12}}>
        <div ref={cityRef} style={{position:"relative"}}>
          <button onClick={()=>setCityOpen(o=>!o)} style={{
            display:"flex",alignItems:"center",gap:6,
            padding:m?"10px 14px":"7px 14px",borderRadius:20,fontSize:13,
            cursor:"pointer",fontWeight:600,minHeight:m?44:undefined,
            border:cityFilters.length>0?"none":"1.5px solid #e5e7eb",
            background:cityFilters.length>0?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#fff",
            color:cityFilters.length>0?"#fff":"#374151",transition:"all 0.15s",
            boxShadow:cityFilters.length>0?"0 2px 8px rgba(0,0,0,0.15)":"none"}}>
            <MapPin size={13}/>
            {cityFilters.length>0?cityFilters.join(", "):"Город"}
            {cityOpen?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
          </button>
          {cityOpen&&(
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,
              background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
              border:"1px solid #e5e7eb",zIndex:50,minWidth:180,padding:"8px 0",overflow:"hidden"}}>
              {ABKHAZIA_CITIES.map(city=>{
                const active=cityFilters.includes(city);
                return(
                  <button key={city} onClick={()=>toggleCity(city)} style={{
                    width:"100%",display:"flex",alignItems:"center",gap:10,
                    padding:"10px 16px",border:"none",background:active?"#eff6ff":"none",
                    cursor:"pointer",fontSize:14,color:active?"#2563eb":"#111",
                    fontWeight:active?700:500,fontFamily:"inherit",textAlign:"left",
                    transition:"background 0.1s"}}>
                    <div style={{width:16,height:16,borderRadius:4,flexShrink:0,
                      border:active?"none":"1.5px solid #d1d5db",
                      background:active?"#2563eb":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {active&&<Check size={11} color="#fff" strokeWidth={3}/>}
                    </div>
                    {city}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {cityFilters.length>0&&(
          <button onClick={()=>setCityFilters([])} style={{padding:m?"10px 12px":"7px 12px",
            borderRadius:20,fontSize:12,cursor:"pointer",border:"1px solid #fecaca",
            background:"#fff5f5",color:"#dc2626",fontWeight:600,minHeight:m?44:undefined}}>
            ✕ Сбросить город
          </button>
        )}
      </div>

      {/* Sort pills */}
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:18}}>
        <span style={{fontSize:12,color:"#9ca3af",fontWeight:600}}>Сортировать:</span>
        {SORT_OPTIONS.map(({key,label})=>{
          const active=sorts.find(s=>s.key===key);
          const priority=sorts.findIndex(s=>s.key===key)+1;
          const arrow=active?(active.dir==="desc"?"↓":"↑"):"";
          return(
            <button key={key} onClick={()=>toggleSort(key)}
              title={active?(active.dir==="desc"?"Нажмите — по возрастанию":"Нажмите — убрать"):"По убыванию"}
              style={{display:"flex",alignItems:"center",gap:5,padding:m?"10px 14px":"7px 14px",
                borderRadius:20,fontSize:13,cursor:"pointer",fontWeight:600,minHeight:m?44:undefined,
                border:active?"none":"1.5px solid #e5e7eb",
                background:active?"linear-gradient(to top right,#0c4a6e,#38bdf8)":"#fff",
                color:active?"#fff":"#374151",transition:"all 0.15s",
                boxShadow:active?"0 2px 8px rgba(0,0,0,0.15)":"none"}}>
              {label}
              {active&&<span style={{fontWeight:800}}>{arrow}</span>}
              {active&&sorts.length>1&&(
                <span style={{background:"rgba(255,255,255,0.3)",borderRadius:"50%",
                  width:16,height:16,fontSize:10,fontWeight:800,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {priority}
                </span>
              )}
            </button>
          );
        })}
        {sorts.length>0&&(
          <button onClick={()=>setSorts([])} style={{padding:m?"10px 12px":"7px 12px",borderRadius:20,
            fontSize:12,cursor:"pointer",border:"1px solid #fecaca",
            background:"#fff5f5",color:"#dc2626",fontWeight:600,minHeight:m?44:undefined}}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Count */}
      <div style={{marginBottom:16,color:"#9ca3af",fontSize:13}}>
        Найдено: <strong style={{color:"#111"}}>{sorted.length}</strong>{" "}
        {plural(sorted.length,"анкета","анкеты","анкет")}
        {search&&<span style={{marginLeft:8,color:"#2563eb",fontWeight:600}}>· «{search}»</span>}
      </div>

      {/* Cards */}
      {loading?(
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(auto-fill,minmax(440px,1fr))",gap:m?10:14}}>
          {Array.from({length:4}).map((_,i)=><WorkerCardSkeleton key={i}/>)}
        </div>
      ):sorted.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af"}}>
          <Search size={40} style={{marginBottom:12,opacity:0.3}}/>
          <div style={{fontSize:15,marginBottom:6}}>Ничего не найдено</div>
          <div style={{fontSize:13}}>Попробуйте другой запрос или другой город</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(auto-fill,minmax(440px,1fr))",gap:m?10:14}}>
          {sorted.map((w,i)=>(
            <WorkerCard key={w.id} worker={w} index={i} onContact={onContact} ratings={ratings}
              isFav={favorites.includes(w.id)} onToggleFav={onToggleFav}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const PAGE_TITLES={
  home:"АбхДжоб — специалисты Абхазии",
  catalog:"Каталог специалистов — АбхДжоб",
  profile:"Личный кабинет — АбхДжоб",
  orders:"История заказов — АбхДжоб",
  faq:"Вопросы и ответы — АбхДжоб",
  privacy:"Политика конфиденциальности — АбхДжоб",
  terms:"Пользовательское соглашение — АбхДжоб",
};

export default function App(){
  const [users,setUsers]=useState([]);
  const [currentUser,setCurrentUser]=useState(null);
  const [workers,setWorkers]=useState(INITIAL_WORKERS);
  const [orders,setOrders]=useState([]);
  const [ratings,setRatings]=useState([]);
  const [page,setPage]=useState("home");
  const [contact,setContact]=useState(null);
  const [showWorkerForm,setShowWorkerForm]=useState(false);
  const [showAuth,setShowAuth]=useState(false);
  const [catalogSearch,setCatalogSearch]=useState("");
  const [favorites,setFavorites]=useState([]);
  const {toast,ToastContainer}=useToast();

  // Загрузка данных при старте
  useEffect(()=>{
    const init=async()=>{
      try{
        const[wRes,rRes,meRes]=await Promise.all([
          api.getWorkers().catch(()=>null),
          api.getRatings().catch(()=>null),
          api.me().catch(()=>({user:null})),
        ]);
        if(wRes?.length)setWorkers(wRes.map(mapWorker));
        if(rRes)setRatings(rRes.map(mapRating));
        if(meRes?.user){
          const u=mapUser(meRes.user);
          setCurrentUser(u);
          const oRes=await api.getOrders().catch(()=>[]);
          setOrders(oRes.map(mapOrder));
          if(u.role==="admin"){
            const uRes=await api.getUsers().catch(()=>[]);
            setUsers(uRes.map(mapUser));
          }
        }
      }catch(e){
        console.error("Init error:",e);
      }
    };
    init();
  },[]);

  useEffect(()=>{document.title=PAGE_TITLES[page]||"АбхДжоб";},[page]);

  const toggleFavorite=id=>{
    const isFav=favorites.includes(id);
    setFavorites(prev=>isFav?prev.filter(f=>f!==id):[...prev,id]);
    toast(isFav?"Убрано из избранного":"Добавлено в избранное",isFav?"info":"success");
  };

  const pendingRatings=currentUser
    ?orders.filter(o=>o.status==="completed"&&o.employerId===currentUser.id&&
        !o.ratingSkippedSession&&
        !ratings.find(r=>r.orderId===o.id&&r.employerId===currentUser.id))
    :[];

  const handleRate=async(order,score)=>{
    try{
      const result=await api.createRating({worker_id:order.workerId,order_id:order.id,score});
      setRatings(prev=>[...prev,mapRating(result)]);
    }catch(e){
      toast(e.message||"Ошибка при оценке","error");
    }
  };
  const handleSkip=()=>{
    setOrders(orders.map(o=>o.id===pendingRatings[0]?.id?{...o,ratingSkippedSession:true}:o));
  };
  const handleNav=key=>{
    if(key==="postWorker"){
      if(!currentUser){setShowAuth(true);return;}
      setShowWorkerForm(true);return;
    }
    if(key==="auth"){setShowAuth(true);return;}
    const pages=["home","catalog","profile","orders","faq","privacy","terms"];
    if(pages.includes(key))setPage(key);
  };
  const handleOrderCreated=async(workerId)=>{
    try{
      const result=await api.createOrder(workerId);
      setOrders(prev=>[mapOrder(result),...prev]);
      toast("Заказ создан! Ожидайте связи.");
    }catch(e){
      if(e.message?.includes("уже активен"))toast("Заказ с этим специалистом уже активен","info");
      else toast(e.message||"Ошибка создания заказа","error");
    }
  };
  const handleAuth=async(user,pendingWorker)=>{
    setCurrentUser(user);
    setShowAuth(false);
    setPage("home");
    if(pendingWorker)setWorkers(prev=>[pendingWorker,...prev]);
    const oRes=await api.getOrders().catch(()=>[]);
    setOrders(oRes.map(mapOrder));
    if(user.role==="admin"){
      const uRes=await api.getUsers().catch(()=>[]);
      setUsers(uRes.map(mapUser));
    }
  };
  const handleLogout=()=>{
    api.logout().catch(()=>{});
    setCurrentUser(null);
    setOrders([]);
    setPage("home");
  };

  const isMobile=useIsMobile();

  return(
    <div style={{minHeight:"100vh",background:"#F5F8FB",fontFamily:"'Nunito',sans-serif"}}>
      <ToastContainer/>

      {/* Rating prompt */}
      {pendingRatings.length>0&&(
        <RatingPrompt order={pendingRatings[0]}
          onRate={score=>handleRate(pendingRatings[0],score)}
          onSkip={handleSkip}/>
      )}

      {/* Auth modal */}
      {showAuth&&(
        <AuthModal onAuth={handleAuth} onClose={()=>setShowAuth(false)}
          users={users} setUsers={setUsers}/>
      )}

      {/* ── Header ── */}
      <header style={{background:"#fff",borderBottom:"1px solid #f3f4f6",
        position:"sticky",top:0,zIndex:300,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>

        {/* Row 1 — brand bar */}
        <div style={{borderBottom:"1px solid #f3f4f6"}}>
          <button onClick={()=>setPage("home")} style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            width:"100%",padding:"9px 16px",background:"none",border:"none",cursor:"pointer"}}>
            {/* Logo icon — blue on white */}
            <LogoIcon size={32} />
            <span style={{fontWeight:900,fontSize:20,color:"#111",letterSpacing:"-0.5px"}}>AbhJob</span>
          </button>
        </div>

        {/* Row 2 — nav bar */}
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",
          alignItems:"center",height:48,padding:"0 12px",gap:8}}>
          <HamburgerMenu currentUser={currentUser} onNav={handleNav} onLogout={handleLogout}/>
          <div style={{flex:1}}/>
          {!currentUser?(
            <button onClick={()=>setShowAuth(true)} style={{
              background:"linear-gradient(to top right,#0c4a6e,#38bdf8)",color:"#fff",border:"none",borderRadius:10,
              padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600,
              display:"flex",alignItems:"center",gap:6,
              animation:"btnGlow 2.5s ease-in-out infinite"}}>
              <User size={14}/>Войти
            </button>
          ):(
            <button onClick={()=>setPage("profile")} style={{
              display:"flex",alignItems:"center",gap:8,padding:"6px 12px",
              background:"#F5F8FB",borderRadius:10,border:"1px solid #f3f4f6",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:"50%",
                background:COLORS[currentUser.id%8],flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",fontSize:11,fontWeight:700}}>
                {getInitials(currentUser.name)}
              </div>
              {!isMobile&&<span style={{fontSize:13,fontWeight:600,color:"#374151"}}>
                {currentUser.name.split(" ")[0]}
              </span>}
            </button>
          )}
        </div>
      </header>

      {/* Pages */}
      <div key={page} >
      {page==="home"&&<LandingPage onNavigate={handleNav} workerCount={workers.length}
        onSearch={q=>{setCatalogSearch(q);setPage("catalog");}}/>}
      {page==="catalog"&&<CatalogPage workers={workers} ratings={ratings} onContact={setContact}
        initialSearch={catalogSearch} favorites={favorites} onToggleFav={toggleFavorite}/>}
      {page==="profile"&&currentUser&&(
        <CabinetPage currentUser={currentUser} setCurrentUser={setCurrentUser}
          users={users} setUsers={setUsers} workers={workers} setWorkers={setWorkers}
          orders={orders} setOrders={setOrders} ratings={ratings}
          favorites={favorites} onToggleFav={toggleFavorite} onContact={setContact}/>
      )}
      {page==="orders"&&currentUser&&(
        <OrdersPage currentUser={currentUser} orders={orders} setOrders={setOrders} ratings={ratings}/>
      )}
      {page==="faq"&&<FaqPage onNav={handleNav}/>}
      {page==="privacy"&&<PrivacyPage/>}
      {page==="terms"&&<TermsPage/>}
      </div>

      {/* Modals */}
      {showWorkerForm&&(
        <WorkerForm onClose={()=>setShowWorkerForm(false)}
          onAdd={w=>{setWorkers([w,...workers]);setShowWorkerForm(false);}}
          currentUser={currentUser}/>
      )}
      {contact&&(
        <ContactModal worker={contact} currentUser={currentUser}
          onClose={()=>setContact(null)}
          onOrderCreated={handleOrderCreated}
          onNeedAuth={()=>{setContact(null);setShowAuth(true);}}/>
      )}

      {/* Footer */}
      <footer style={{marginTop:48,borderTop:"1px solid #f3f4f6",background:"#fff",padding:"20px 16px"}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",
          flexDirection:isMobile?"column":"row",
          justifyContent:"space-between",alignItems:isMobile?"flex-start":"center",
          gap:isMobile?12:16,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <LogoIcon size={36} />
            <span style={{fontWeight:800,fontSize:15,color:"#111"}}>AbhJob</span>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[["privacy","Конфиденциальность"],["terms","Соглашение"],["faq","FAQ"]].map(([key,label])=>(
              <button key={key} onClick={()=>setPage(key)} style={{background:"none",border:"none",
                cursor:"pointer",fontSize:13,color:"#9ca3af",fontFamily:"inherit",padding:0}}>
                {label}
              </button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#d1d5db"}}>© 2025 AbhJob</span>
        </div>
      </footer>
    </div>
  );
}