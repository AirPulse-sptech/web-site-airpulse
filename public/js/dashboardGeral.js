const N=dadosPlaca.componentes.cpu.leituras.length;
const ultimaLeitura=horarioUltimaLeitura();
const L=Object.fromEntries(Object.entries(dadosPlaca.componentes).map(([chave,componente])=>[chave==='disco'?'disk':chave,[componente.limiteAtencao,componente.limiteCritico]]));
const SN=['Normal','Atenção','Crítico'];
const $=s=>document.querySelector(s);
const cs=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const pc=(v,n=1)=>v==null?'-':v.toFixed(n).replace('.',',')+'%';
const lab=hora=>formatarHora(hora);
const av2=(a,i,j)=>{let s=0,n=0;for(let x=i;x<j;x++)if(a[x]!=null){s+=a[x];n++}return n?s/n:null};
const mxv=(a,i,j)=>{let m=null;for(let x=i;x<j;x++)if(a[x]!=null&&(m==null||a[x]>m))m=a[x];return m};
const sv=(v,m)=>v>=L[m][1]?2:v>=L[m][0]?1:0;

function icon(name,size=16){
  const h=`width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const p={
    plane:'<path d="M3 12h6l5-7h2l-2.5 7H21c.8 0 1.4.4 1.4 1s-.6 1-1.4 1h-7.5L16 21h-2l-5-7H3l-1.5-2L3 12Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    triangle:'<path d="M12 3 2.7 20h18.6L12 3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    gauge:'<path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/><path d="M4 14h2"/><path d="M18 14h2"/>',
    activity:'<path d="M4 12h3l2-6 4 12 2-6h5"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>'
  };
  return `<svg ${h}>${p[name]||p.activity}</svg>`;
}

const frota=obterFrotaDemonstrativa();
const FMCS=frota.flatMap(aeronave=>aeronave.fmcs.map(fmc=>{
  const placas=fmc.placas.map(placa=>{
    const originais={cpu:obterLeiturasMinuto(placa.componentes.cpu),ram:obterLeiturasMinuto(placa.componentes.ram),disk:obterLeiturasMinuto(placa.componentes.disco)};
    const picos=Object.fromEntries(Object.entries(originais).map(([metrica,valores])=>[metrica,Array.from({length:N},(_,hora)=>mxv(valores,hora*60,(hora+1)*60))]));
    return {id:placa.identificacao,originais,...picos,alertas:listarAlertasPlaca(placa)};
  });
  const leituras=metrica=>Array.from({length:N},(_,hora)=>mxv(placas.map(placa=>placa[metrica][hora]),0,placas.length));
  const av=Array.from({length:N},(_,hora)=>{
    const valores=placas.flatMap(placa=>Object.values(placa.originais).flatMap(leituras=>leituras.slice(hora*60,(hora+1)*60)));
    return valores.filter(valor=>valor!=null).length/valores.length*100;
  });
  return {
    id:`${aeronave.identificacao}-${fmc.identificacao}`,
    nome:fmc.nome,
    identificacao:fmc.identificacao,
    plane:aeronave.identificacao,
    modelo:aeronave.modelo,
    op:aeronave.operador,
    placas,
    estadoAtual:['normal','moderado','critico'].indexOf(obterEstadoPlacas(fmc.placas,ultimaLeitura).classe),
    cpu:leituras('cpu'),ram:leituras('ram'),disk:leituras('disk'),
    av,
    sev:Array.from({length:N},(_,hora)=>av[hora]===0?-1:Math.max(...placas.flatMap(placa=>['cpu','ram','disk'].map(metrica=>sv(placa[metrica][hora],metrica))))),
    alertas:placas.flatMap(placa=>placa.alertas)
  };
}));
const PLANES=frota.map(aeronave=>({
  0:aeronave.identificacao,1:aeronave.modelo,2:aeronave.operador,
  fmcs:FMCS.filter(fmc=>fmc.plane===aeronave.identificacao)
}));
const planeState=(pl,i,j)=>Math.max(...pl.fmcs.map(f=>f.estadoAtual));
const planeAvg=(pl,m,i,j)=>{const v=pl.fmcs.map(f=>av2(f[m],i,j)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0};
const planeAvail=(pl,i,j)=>planeAvg(pl,'av',i,j);
function componentPeak(fmcs,metrica,inicio,fim){
  let pico={valor:null,placa:null,fmc:null};
  fmcs.forEach(f=>f.placas.forEach(placa=>{
    const valor=mxv(placa.originais[metrica],inicio*60,fim*60);
    if(valor!=null&&(pico.valor==null||valor>pico.valor))pico={valor,placa:placa.id,fmc:f.nome};
  }));
  return pico;
}
const peakSource=pico=>pico.placa?`Placa ${esc(pico.placa)} · ${esc(pico.fmc)}`:'Sem dados no período';

const S={p:N,m:'ram',fs:-1,sk:'st',sd:-1};
let donutChart=null;
let aeronaveAberta=null,fmcAberto=null;

function render(){
  const i=N-S.p; PLANES.forEach(pl=>pl.st=planeState(pl,i,N));
  const cnt=[0,0,0];PLANES.forEach(pl=>cnt[pl.st]++);
  const fleetAvail=PLANES.reduce((s,p)=>s+planeAvail(p,i,N),0)/PLANES.length;
  const crit=FMCS.filter(f=>f.estadoAtual===2).length;
  const ocorrencias=FMCS.flatMap(f=>f.alertas).filter(alerta=>alerta.hora>=i);
  $('#sub').textContent=`Dados demonstrativos · ${lab(i)} a ${lab(ultimaLeitura)} · ${PLANES.length} aeronaves · ${FMCS.length} FMCs · Estado atual às ${lab(ultimaLeitura)}`;
  const k=[
    ['gauge','ok','Disponibilidade da Frota',pc(fleetAvail), 'leituras recebidas no período'],
    ['triangle','at','Exigem Atenção',cnt[1]+cnt[2],`${cnt[2]} crítica / ${cnt[1]} em atenção agora`],
    ['bell','cr','FMCs com Estado Crítico',crit,'na última coleta'],
    ['bell','at','Ocorrências no Período',ocorrencias.length,`${ocorrencias.filter(alerta=>alerta.status.classe==='critico').length} críticas no período`],
  ];
  $('#kpis').innerHTML=k.map(x=>`<div class="k"><div class="k-icon ${x[1]}">${icon(x[0],16)}</div><div class="k-body"><small>${x[2]}</small><b>${x[3]}</b><em>${x[4]}</em></div></div>`).join('');
  $('#donut-n').textContent=PLANES.length;
  $('#fleet-total').textContent=`Total de ${PLANES.length} aeronaves`;
  if(donutChart)donutChart.destroy();
  donutChart=new Chart($('#donut'),{
    type:'doughnut',
    data:{labels:['Normal','Atenção','Crítico'],datasets:[{data:cnt,backgroundColor:[cs('--ok'),cs('--at'),cs('--cr')],borderWidth:0}]},
    options:{cutout:'72%',plugins:{legend:{display:false}},animation:{duration:300}}
  });
  $('#fleet-leg').innerHTML=['Normal','Atenção','Crítico'].map((n,x)=>` <div class="fleet-item"> <span class="fleet-dot" style="background:${cs(['--ok','--at','--cr'][x])}"></span> <span class="fleet-label">${n}</span><span class="fleet-count">${cnt[x]}</span> <span class="fleet-pct">${Math.round(cnt[x]/PLANES.length*100)}%</span> </div>`).join('');
  $('#avail-list').innerHTML=[...PLANES].sort((a,b)=>planeAvail(a,i,N)-planeAvail(b,i,N)).map(pl=>{
    const v=planeAvail(pl,i,N),col=v>=99?cs('--ok'):v>=95?cs('--at'):cs('--cr');
    return `<div class="avail-row"><strong>${pl[0]}</strong><div class="avail-track"><div class="avail-fill" style="width:${Math.min(v,100)}%;background:${col}"></div></div><span class="avail-val" style="color:${col}">${pc(v)}</span></div>`
  }).join('');
  montarMapaCalor();buildList();
  if(aeronaveAberta)openDrawer(aeronaveAberta);
}

const NIVEIS_DO_ESTADO = [1, 2, 4];

function estadoDaAeronaveNaHora(aeronave, hora) {
  let pior = -1;
  aeronave.fmcs.forEach(fmc => {
    if (fmc.sev[hora] != null) pior = Math.max(pior, fmc.sev[hora]);
  });
  return pior;
}

function montarMapaCalor() {
  const primeiraHora = N - S.p;
  const mapa = $('#mapa');
  mapa.style.setProperty('--totalCelulas', S.p);

  const marcos=Math.ceil(S.p/2);
  let html = `<div class="mapaLinha"><div class="mapaDatas" style="grid-template-columns:repeat(${marcos},minmax(0,1fr))">`;
  for (let marco = 0; marco < marcos; marco++) {
    html += `<span>${lab(primeiraHora + marco*2)}</span>`;
  }
  html += '</div></div>';

  PLANES.forEach(aeronave => {
    const prefixo = aeronave[0];
    let celulas = '';
    for (let hora = primeiraHora; hora < N; hora++) {
      const estado = estadoDaAeronaveNaHora(aeronave, hora);
      const nivel = estado < 0 ? 0 : NIVEIS_DO_ESTADO[estado];
      const texto = estado < 0 ? 'Sem dados' : SN[estado];
      celulas += `<div class="celula nivel${nivel}" title="${prefixo} · ${lab(hora)}: ${texto}"></div>`;
    }
    html += `
      <div class="mapaLinha">
        <div class="mapaRotulo">${prefixo}</div>
        <div class="mapaCelulas">${celulas}</div>
        <button class="mapaSeta" type="button" data-id="${prefixo}" aria-label="Ver detalhes de ${prefixo}">›</button>
      </div>`;
  });
  mapa.innerHTML = html;
}

function statusPill(st){
  return `<span class="status-pill ${['status-normal','status-attention','status-critical'][st]}">${SN[st]}</span>`;
}

function buildList(){
  const i=N-S.p;
  let rows=PLANES.map(pl=>{const pico=componentPeak(pl.fmcs,'ram',i,N);return {pl,st:pl.st,ram:pico.valor,pico}});
  const defs=[['Todos',-1],['Crítico',2],['Atenção',1],['Normal',0]];
  const counts=[PLANES.length,PLANES.filter(p=>p.st===2).length,PLANES.filter(p=>p.st===1).length,PLANES.filter(p=>p.st===0).length];
  $('#chips').innerHTML=defs.map((d,n)=>`<button data-f="${d[1]}" class="${S.fs===d[1]?'on':''}">${d[0]} (${counts[n]})</button>`).join('');
  if(S.fs>=0)rows=rows.filter(r=>r.st===S.fs);
  rows.sort((a,b)=>((a[S.sk]??0)-(b[S.sk]??0))*S.sd);
  $('#aircraft-list').innerHTML=rows.map(r=>`
    <div class="aircraft-row" data-id="${r.pl[0]}">
      <div class="aircraft-main">
        <div class="aircraft-marker">${icon('plane',13)}</div>
        <div class="aircraft-copy"><strong>${r.pl[0]}</strong><small>${r.pl[1]} / ${r.pl[2]}</small></div>
      </div>
      <div class="metric-cell"><small>Status</small><div>${statusPill(r.st)}</div></div>
      <div class="metric-cell"><small>Pico de RAM</small><strong>${pc(r.ram)}</strong><small>${peakSource(r.pico)}</small></div>
      <div class="open-btn">Abrir detalhes ${icon('chevron',11)}</div>
    </div>`).join('');
}

function openDrawer(id){
  const pl=PLANES.find(p=>p[0]===id);if(!pl)return;
  aeronaveAberta=id;
  const i=N-S.p,primary=pl.fmcs.find(fmc=>fmc.id===fmcAberto)||pl.fmcs[0];
  const peakCPU=componentPeak(pl.fmcs,'cpu',i,N),peakRAM=componentPeak(pl.fmcs,'ram',i,N),peakDisk=componentPeak(pl.fmcs,'disk',i,N),availability=planeAvail(pl,i,N);
  $('#dr').innerHTML=`
    <div class="dr-head">
      <div><h2>Aeronave ${pl[0]}</h2><p class="mut">${pl[1]} / Identificação ${pl[0]}</p></div>
      <button class="dr-close" id="cl">${icon('x',13)}</button>
    </div>
    <div class="dr-status">${statusPill(pl.st)}<span class="mut">Estado atual · ${lab(ultimaLeitura)}</span></div>
    <div class="dr-tabs" id="dr-tabs">
      ${pl.fmcs.map((f,n)=>`<button class="dr-tab ${f.id===primary.id?'on':''}" data-fmc="${f.id}"><strong>${esc(f.nome)}</strong><small>${f.identificacao}</small></button>`).join('')}
    </div>
    <div id="dr-fmc-body"></div>
    <div class="dr-section">
      <h3>Principais Informações</h3>
      <div class="dr-info">
        <div class="dr-row"><span>Modelo</span><span>${pl[1]}</span></div>
        <div class="dr-row"><span>Operador</span><span>${pl[2]}</span></div>
        <div class="dr-row"><span>Pico de CPU</span><span>${pc(peakCPU.valor)}<small>${peakSource(peakCPU)}</small></span></div>
        <div class="dr-row"><span>Pico de RAM</span><span>${pc(peakRAM.valor)}<small>${peakSource(peakRAM)}</small></span></div>
        <div class="dr-row"><span>Pico de armazenamento</span><span>${pc(peakDisk.valor)}<small>${peakSource(peakDisk)}</small></span></div>
        <div class="dr-row"><span>Disponibilidade</span><span>${pc(availability)}</span></div>
      </div>
    </div>
    <p class="mut">Limites: atenção em ${L.cpu[0]}% · crítico em ${L.cpu[1]}%</p>
  `;
  function drawFmc(f){
    fmcAberto=f.id;
    const sev=f.estadoAtual;
    const cls=sev===2?'critical':sev===1?'attention':'normal';
    const cpu=componentPeak([f],'cpu',i,N),ram=componentPeak([f],'ram',i,N);
    $('#dr-fmc-body').innerHTML=`
      <div class="dr-section" style="border-top:0;padding-top:0;margin-top:0">
        <h3>Status do FMC</h3>
        <div class="dr-alert ${cls}">
          <div class="dr-alert-icon">${icon(sev===2?'triangle':sev===1?'bell':'gauge',14)}</div>
          <div><strong>${SN[sev]}</strong><small>${sev===2?'Estado acima do limite crítico':sev===1?'Estado acima do limite de atenção':'Normal na última coleta'}</small></div>
          <span class="dr-online">${lab(ultimaLeitura)}</span>
        </div>
      </div>
      <div class="dr-section">
        <h3>Resumo de Alertas</h3>
        <div class="dr-summary">
          <div class="dr-stat"><small>Ocorrências no período</small><strong>${f.alertas.filter(alerta=>alerta.hora>=i).length}</strong></div>
          <div class="dr-stat"><small>Disponibilidade</small><strong>${pc(av2(f.av,i,N))}</strong></div>
          <div class="dr-stat"><small>Pico de CPU</small><strong>${pc(cpu.valor)}</strong><small>${cpu.placa?`Placa ${esc(cpu.placa)}`:'Sem dados no período'}</small></div>
          <div class="dr-stat"><small>Pico de RAM</small><strong>${pc(ram.valor)}</strong><small>${ram.placa?`Placa ${esc(ram.placa)}`:'Sem dados no período'}</small></div>
        </div>
      </div>
    `;
  }
  drawFmc(primary);

  $('#cl').onclick=()=>{

    $('#dr').innerHTML = '';
    aeronaveAberta=null;fmcAberto=null;
  };
  $('#dr-tabs').onclick=e=>{
    const b=e.target.closest('.dr-tab');if(!b)return;
    [...$('#dr-tabs').children].forEach(x=>x.classList.toggle('on',x===b));
    const f=pl.fmcs.find(x=>x.id===b.dataset.fmc);if(f)drawFmc(f);
  };
}

function inicializarDashboardGeral(){
  if(!verificarSessao()||!podeAcessarPagina('dashboardGeral.html'))return;
  const botoesPeriodo = document.querySelectorAll('.botaoFiltro');
  for (const botao of botoesPeriodo) {
    botao.addEventListener('click', function () {
      S.p = Number(botao.dataset.periodo);
      for (const item of botoesPeriodo) {
        const selecionado = item === botao;
        item.classList.toggle('selecionado', selecionado);
        item.setAttribute('aria-pressed', String(selecionado));
      }
      render();
    });
  }
  $('#chips').onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    S.fs=+b.dataset.f;
    buildList();
  };
  $('#aircraft-list').onclick=e=>{
    const row=e.target.closest('.aircraft-row');if(row)openDrawer(row.dataset.id);
  };

  $('#mapa').onclick=e=>{
    const seta=e.target.closest('.mapaSeta');if(seta)openDrawer(seta.dataset.id);
  };

  render();

  if(PLANES.length > 0) openDrawer(PLANES[0][0]);
}

inicializarDashboardGeral();

