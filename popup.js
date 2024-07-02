document.addEventListener('DOMContentLoaded', () => {
  let pageUrl = null;
  let videoId = null;
  let videoTitle = null;

  document.getElementById('MergeFilesButton').addEventListener('click', mergeFiles);
  document.getElementById('mergeInput').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    pageUrl = tabs[0].url;
    if (pageUrl.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(pageUrl.split("?")[1]);
      videoId = urlParams.get("v");

      document.getElementById('CopyVideoIdBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(videoId);
      });

      document.getElementById('optionsButton').addEventListener('click', () => {
        const buttonContainer = document.getElementById('ButtonContainer');
        buttonContainer.style.display = buttonContainer.style.display === 'none' || buttonContainer.style.display === '' ? 'flex' : 'none';
      });

      let imagesArray = [];
      await chrome.storage.local.get("ImagesArray").then((result) => {
        if (result.ImagesArray && videoId && result.ImagesArray[videoId]) {
          imagesArray = [...result.ImagesArray[videoId]];
        }
      });

      if (imagesArray.length > 0) {
        videoTitle = imagesArray[0][3];
        const container = document.getElementById('container');
        const titleElement = document.createElement('h1');
        titleElement.style.display = 'flex';
        titleElement.style.justifyContent = 'center';
        titleElement.style.marginBottom = '20px';
        titleElement.innerText = videoTitle;
        container.appendChild(titleElement);

        imagesArray.forEach(([imgSrc, linkHref, noteText]) => {
          const imageElement = document.createElement('img');
          imageElement.src = imgSrc;
          imageElement.style.width = '100%';
          const linkElement = document.createElement('a');
          linkElement.href = linkHref;
          linkElement.appendChild(imageElement);
          container.appendChild(linkElement);
          
          if (noteText) {
            const noteElement = document.createElement('p');
            noteElement.style.fontSize = '15px';
            noteElement.innerText = noteText;
            container.appendChild(noteElement);
          }
        });
      }
    }
  });

  async function mergeFiles(e) {
    e.stopPropagation();
    const mergeInputValue = document.getElementById('mergeInput').value;
    if (mergeInputValue) {
      let imagesArray = {};
      await chrome.storage.local.get("ImagesArray").then((result) => {
        if (result.ImagesArray) {
          imagesArray = { ...result.ImagesArray };
        }
      });

      if (imagesArray[mergeInputValue]) {
        imagesArray[videoId] = [...imagesArray[mergeInputValue], ...imagesArray[videoId]];
        await chrome.storage.local.set({ ImagesArray: imagesArray });
        window.location.reload();
      } else {
        alert("Please enter a valid video ID to merge.");
        document.getElementById('mergeInput').value = "";
      }
    }
  }

  document.getElementById('downloadbtns').addEventListener('click', convertHTMLtoPDF);

  function convertHTMLtoPDF() {
    const container = document.getElementById('container');
    const opt = {
      margin: [0.38, 0.5],
      filename: `${videoTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, allowTaint: true, letterRendering: true },
      pagebreak: { avoid: ['a', 'p'] },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(container).save();
  }
});
