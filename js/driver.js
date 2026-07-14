const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxZ7rZ61GvwKD3rDbR4GezfafE63K0v7UdeprLGYxYaO9OakVGGairzGIMhkocB0U8AzQ/exec";

document.querySelectorAll('.docfile').forEach(function(input){
  input.addEventListener('change',function(){
    const wrap=input.closest('.upload-wrapper');
    const box=wrap.querySelector('.upload-box');
    const preview=wrap.querySelector('.preview-bar');
    const file=input.files[0];
    if(!file){ preview.classList.remove('active'); box.style.display='block'; return;}
    const reader=new FileReader();
    reader.onload=function(e){
      preview.querySelector('.preview-name').textContent = file.name;
      box.style.display='none';
      preview.classList.add('active');
    };
    reader.readAsDataURL(file);
  });
});

function validatePhone(v){return /^[0-9]{10}$/.test(v)}
function validateAadhaar(v){return /^[0-9]{12}$/.test(v)}

document.querySelector('[name=Phone]').addEventListener('blur',function(){
  const ok=validatePhone(this.value);
  this.style.borderColor = ok ? 'var(--success)' : 'var(--error)';
  document.getElementById('err_phone').style.display=ok?'none':'block';
});
document.querySelector('[name=Aadhaar_Number]').addEventListener('blur',function(){
  const ok=validateAadhaar(this.value);
  this.style.borderColor = ok ? 'var(--success)' : 'var(--error)';
  document.getElementById('err_aadhar').style.display=ok?'none':'block';
});

function compressImage(file){
  return new Promise((res,rej)=>{
    const img=new Image();const rd=new FileReader();
    rd.onload=e=>{img.src=e.target.result};rd.onerror=rej;
    img.onload=()=>{
      const MAX=1400;let{width:w,height:h}=img;
      if(w>MAX){h=Math.round(h*(MAX/w));w=MAX;}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      res(c.toDataURL('image/jpeg',0.82).split(',')[1]);
    };img.onerror=rej;rd.readAsDataURL(file);
  });
}
function pdfToBase64(file){
  return new Promise((res,rej)=>{
    const rd=new FileReader();rd.onload=()=>res(rd.result.split(',')[1]);rd.onerror=rej;rd.readAsDataURL(file);
  });
}

const progressWrap=document.getElementById('progressWrap');
const progressFill=document.getElementById('progressFill');
const progressText=document.getElementById('progressText');
const progressPct=document.getElementById('progressPercent');
const submitBtn=document.getElementById('submitBtn');

function setProgress(pct,label){
  progressFill.style.width=pct+'%';progressPct.textContent=pct+'%';progressText.textContent=label;
}

function fetchWithTimeout(url,opts,ms){
  const ctrl=new AbortController();
  const id=setTimeout(()=>ctrl.abort(),ms);
  return fetch(url,{...opts,signal:ctrl.signal}).finally(()=>clearTimeout(id));
}

let submitting=false;
const form=document.getElementById('driverForm');

form.addEventListener('submit',async function(e){
  e.preventDefault();
  if(submitting)return;

  const phone=form.querySelector('[name=Phone]').value;
  const aadhar=form.querySelector('[name=Aadhaar_Number]').value;
  if(!validatePhone(phone)){ alert('Please enter a valid 10-digit mobile number.'); return;}
  if(!validateAadhaar(aadhar)){ alert('Aadhaar number must be exactly 12 digits.'); return;}

  submitting=true; submitBtn.disabled=true;
  progressWrap.classList.add('active');
  setProgress(0,'Preparing your documents...');

  try{
    const fd=new FormData(form);
    const payload={};
    fd.forEach((v,k)=>{if(!(v instanceof File))payload[k]=v;});

    const inputs=Array.from(document.querySelectorAll('.docfile'));
    const total=inputs.filter(i=>i.files[0]).length;
    let done=0;

    for(const input of inputs){
      const file=input.files[0];if(!file)continue;
      const pct=Math.round((done/total)*72);
      let base64,mimeType=file.type;
      if(file.type==='application/pdf'){
        if(file.size>12*1024*1024){ alert('A PDF file is over 12 MB.'); submitting=false;submitBtn.disabled=false;submitBtn.textContent='Submit Application';progressWrap.classList.remove('active');return;}
        setProgress(pct,'Processing PDF...');
        base64=await pdfToBase64(file);
      }else{
        setProgress(pct,'Compressing photo...');
        base64=await compressImage(file);mimeType='image/jpeg';
      }
      const ext=file.type==='application/pdf'?'.pdf':'.jpg';
      payload[input.name]={base64,mimeType,fileName:file.name.replace(/\.[^/.]+$/,'')+ext};
      done++;
    }

    setProgress(82,'Uploading securely...');
    submitBtn.textContent='Submitting...';

    let result;
    try{
      const resp=await fetchWithTimeout(WEB_APP_URL,{method:'POST',body:JSON.stringify(payload)},20000);
      setProgress(96,'Finalising...');
      result=await resp.json();
    }catch(netErr){
      if(netErr.name==='AbortError'){
          document.getElementById('formCard').classList.remove('active');
          document.getElementById('view-thanks').classList.add('active');
          return;
      }
      throw netErr;
    }

    if(result.status==='duplicate'){
      alert('Phone number already registered.'); submitting=false;submitBtn.disabled=false;submitBtn.textContent='Submit Application';progressWrap.classList.remove('active');return;
    }
    if(result.status!=='success'){
      alert(result.message||'Submission failed.'); submitting=false;submitBtn.disabled=false;submitBtn.textContent='Submit Application';progressWrap.classList.remove('active');return;
    }

    setProgress(100,'Done!');
    document.getElementById('formCard').classList.remove('active');
    document.getElementById('view-thanks').classList.add('active');

  }catch(err){
    console.error(err); alert('Something went wrong: '+err.message);
    submitting=false;submitBtn.disabled=false;submitBtn.textContent='Submit Application'; progressWrap.classList.remove('active');
  }
});