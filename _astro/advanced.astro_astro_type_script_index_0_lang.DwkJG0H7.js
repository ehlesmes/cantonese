import{g as A,a as P,b as M,e as B,s as I,c as N,d as x}from"./storage.3cbSW9N4.js";function n(i){const p=document.getElementById(i);if(!p)throw new Error("Missing element: "+i);return p}document.addEventListener("DOMContentLoaded",()=>{const i=n("completed-chapters-list"),p=n("clean-incomplete-btn"),E=n("clear-all-btn"),h=n("confirm-modal"),f=n("confirm-message"),L=n("modal-cancel-btn"),y=n("modal-confirm-btn"),v=n("toast"),g=window.__allChaptersData||[];let r=[],c={},l={},d=null;function u(a,e="success"){v.textContent=a,v.className=`toast-notification show ${e}`,setTimeout(()=>{v.className="toast-notification"},3e3)}function C(){try{r=A(),c=P(),l=M()}catch(a){console.error("LocalStorage load failed:",a),u("Failed to load local storage state","error")}}function S(){try{I(r),N(c),x(l)}catch(a){console.error("LocalStorage save failed:",a),u("Failed to save to local storage","error")}}function R(a){let e=0,o=0;return a.phrases.forEach(t=>{c[t]&&e++}),a.vocab.forEach(t=>{l[t]&&o++}),{phrases:e,vocab:o}}function m(){C();const a=g.filter(e=>r.includes(e.id));if(a.length===0){i.innerHTML=`
        <div class="placeholder-msg">
          No chapters are currently marked as completed.
        </div>
      `;return}i.innerHTML="",a.forEach(e=>{const o=R(e),t=document.createElement("div");t.className="chapter-row",t.innerHTML=`
        <div class="chapter-info">
          <div class="chapter-title-row">
            <span class="chapter-num">Chapter ${e.number}</span>
            <span class="chapter-title">${e.title}</span>
          </div>
          <div class="chapter-counts">
            <span>SRS Progress:</span> 
            <span class="count-tag">${o.phrases} Phrases</span>
            <span class="count-tag">${o.vocab} Vocabulary</span>
          </div>
        </div>
        <button class="remove-btn" data-chapter-id="${e.id}">
          Remove Progress
        </button>
      `,t.querySelector(".remove-btn")?.addEventListener("click",()=>{const s=e.id;f.textContent=`Are you sure you want to remove all progress for Chapter ${e.number}: "${e.title}"? This will mark it incomplete and remove its SRS progress.`,d=()=>k(s,e.number,e.title),b()}),i.appendChild(t)})}function k(a,e,o){r=r.filter(s=>s!==a);const t=g.find(s=>s.id===a);t&&(t.phrases.forEach(s=>{delete c[s]}),t.vocab.forEach(s=>{delete l[s]})),S(),m(),u(`Progress removed for Chapter ${e}: "${o}"`)}function T(){C();let a=0,e=0;g.forEach(o=>{r.includes(o.id)||(o.phrases.forEach(t=>{c[t]&&(delete c[t],a++)}),o.vocab.forEach(t=>{l[t]&&(delete l[t],e++)}))}),S(),m(),u(`Cleaned up ${a} phrase and ${e} vocab orphaned records.`)}function $(){B(),r=[],c={},l={},m(),u("All progress data cleared successfully.","success"),setTimeout(()=>{window.location.reload()},1e3)}function b(){h.setAttribute("aria-hidden","false"),h.classList.add("show")}function w(){h.setAttribute("aria-hidden","true"),h.classList.remove("show"),d=null}L.addEventListener("click",w),y.addEventListener("click",()=>{d&&d(),w()}),p.addEventListener("click",()=>{f.textContent="Are you sure you want to clean up all spaced repetition (SRS) records for chapters that are NOT marked as completed? This will discard your learning progress on those items.",d=T,b()}),E.addEventListener("click",()=>{f.textContent="CRITICAL: Are you sure you want to delete all Cantonese progress and SRS learning history? This will reset all completed chapters, vocabulary cards, and phrasebook stats. This cannot be undone.",d=$,b()}),m()});
