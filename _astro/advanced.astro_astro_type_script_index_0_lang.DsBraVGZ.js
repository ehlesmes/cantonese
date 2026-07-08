import{g as I,a as T,b as $,e as A,s as P,c as M,d as N}from"./storage.DFDdAM6c.js";document.addEventListener("DOMContentLoaded",()=>{const u=document.getElementById("completed-chapters-list"),S=document.getElementById("clean-incomplete-btn"),y=document.getElementById("clear-all-btn"),i=document.getElementById("confirm-modal"),p=document.getElementById("confirm-message"),E=document.getElementById("modal-cancel-btn"),L=document.getElementById("modal-confirm-btn"),h=document.getElementById("toast"),f=window.__allChaptersData||[];let n=[],r={},c={},l=null;function d(a,e="success"){h.textContent=a,h.className=`toast-notification show ${e}`,setTimeout(()=>{h.className="toast-notification"},3e3)}function v(){try{n=I(),r=T(),c=$()}catch(a){console.error("LocalStorage load failed:",a),d("Failed to load local storage state","error")}}function b(){try{P(n),M(r),N(c)}catch(a){console.error("LocalStorage save failed:",a),d("Failed to save to local storage","error")}}function w(a){let e=0,o=0;return a.phrases.forEach(t=>{r[t]&&e++}),a.vocab.forEach(t=>{c[t]&&o++}),{phrases:e,vocab:o}}function m(){v();const a=f.filter(e=>n.includes(e.id));if(a.length===0){u.innerHTML=`
        <div class="placeholder-msg">
          No chapters are currently marked as completed.
        </div>
      `;return}u.innerHTML="",a.forEach(e=>{const o=w(e),t=document.createElement("div");t.className="chapter-row",t.innerHTML=`
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
      `,t.querySelector(".remove-btn").addEventListener("click",()=>{const s=e.id;p.textContent=`Are you sure you want to remove all progress for Chapter ${e.number}: "${e.title}"? This will mark it incomplete and remove its SRS progress.`,l=()=>R(s,e.number,e.title),g()}),u.appendChild(t)})}function R(a,e,o){n=n.filter(s=>s!==a);const t=f.find(s=>s.id===a);t&&(t.phrases.forEach(s=>{delete r[s]}),t.vocab.forEach(s=>{delete c[s]})),b(),m(),d(`Progress removed for Chapter ${e}: "${o}"`)}function k(){v();let a=0,e=0;f.forEach(o=>{n.includes(o.id)||(o.phrases.forEach(t=>{r[t]&&(delete r[t],a++)}),o.vocab.forEach(t=>{c[t]&&(delete c[t],e++)}))}),b(),m(),d(`Cleaned up ${a} phrase and ${e} vocab orphaned records.`)}function B(){A(),n=[],r={},c={},m(),d("All progress data cleared successfully.","success"),setTimeout(()=>{window.location.reload()},1e3)}function g(){i.setAttribute("aria-hidden","false"),i.classList.add("show")}function C(){i.setAttribute("aria-hidden","true"),i.classList.remove("show"),l=null}E.addEventListener("click",C),L.addEventListener("click",()=>{l&&l(),C()}),S.addEventListener("click",()=>{p.textContent="Are you sure you want to clean up all spaced repetition (SRS) records for chapters that are NOT marked as completed? This will discard your learning progress on those items.",l=k,g()}),y.addEventListener("click",()=>{p.textContent="CRITICAL: Are you sure you want to delete all Cantonese progress and SRS learning history? This will reset all completed chapters, vocabulary cards, and phrasebook stats. This cannot be undone.",l=B,g()}),m()});
