// build.js
const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// ১. আপনার মূল HTML ফাইল পড়ুন
const originalHtml = fs.readFileSync('src/original.html', 'utf8');

// ২. HTML থেকে জাভাস্ক্রিপ্ট আলাদা করুন
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let allScripts = '';
let match;

while ((match = scriptRegex.exec(originalHtml)) !== null) {
  if (match[1] && !match[0].includes('src=')) {
    allScripts += match[1] + '\n\n';
  }
}

// ৩. HTML থেকে জাভাস্ক্রিপ্ট ট্যাগ রিমুভ করুন
let cleanHtml = originalHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<!-- Scripts will be loaded separately -->');

// ৪. CSS আলাদা করুন
const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let allCss = '';
let styleMatch;

while ((styleMatch = styleRegex.exec(originalHtml)) !== null) {
  allCss += styleMatch[1] + '\n';
}

// ৫. HTML মিনিফাই করুন
async function minifyHtml() {
  try {
    const minified = await minify(cleanHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: false,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true
    });
    
    // ৬. CSS ইনলাইন করুন
    const htmlWithInlineCss = minified.replace('</head>', 
      `<style>${allCss}</style>\n</head>`);
    
    // ৭. ওবফুসকেটেড জাভাস্ক্রিপ্ট লোডার যোগ করুন
    const finalHtml = htmlWithInlineCss.replace('</body>', 
      `<script src="obfuscated.js"></script>\n</body>`);
    
    // ৮. ফাইনাল HTML সেভ করুন
    fs.writeFileSync('public/index.html', finalHtml);
    
    console.log('✅ HTML processed successfully');
  } catch (error) {
    console.error('HTML minification error:', error);
  }
}

// ৯. জাভাস্ক্রিপ্ট ওবফুসকেট করুন
function obfuscateScripts() {
  const obfuscationResult = JavaScriptObfuscator.obfuscate(allScripts, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 10,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    identifierNamesGenerator: 'hexadecimal',
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
    selfDefending: true,
    disableConsoleOutput: false
  });

  // ১০. লোডার কোড তৈরি করুন
  const loaderCode = `
(function(){
  // Base64 এনকোডেড HTML পার্টস
  const parts = {
    html: '${Buffer.from(fs.readFileSync('public/index.html')).toString('base64')}',
    config: '${Buffer.from(JSON.stringify({
      firebase: {
        apiKey: "AIzaSyBL6nN2TH4uyp8iso6Q99_QHkYyHnslXjU",
        authDomain: "tg-bot-sirome-tv.firebaseapp.com",
        databaseURL: "https://tg-bot-sirome-tv-default-rtdb.firebaseio.com",
        projectId: "tg-bot-sirome-tv",
        storageBucket: "tg-bot-sirome-tv.firebasestorage.app",
        messagingSenderId: "764854962010",
        appId: "1:764854962010:web:6a77f650622614de4d5563",
        measurementId: "G-8G48FV41TH"
      }
    })).toString('base64')}'
  };
  
  // HTML পার্স করুন
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(atob(parts.html), 'text/html');
  
  // বডি রিপ্লেস করুন
  document.documentElement.innerHTML = htmlDoc.documentElement.innerHTML;
  
  // ফায়ারবেস কনফিগারেশন সেট করুন
  window.firebaseConfig = JSON.parse(atob(parts.config)).firebase;
  
  // মেইন জাভাস্ক্রিপ্ট এক্সিকিউট করুন
  ${obfuscationResult.getObfuscatedCode()}
  
  // DOM কন্টেন্ট লোডেড হওয়ার পর কাজ করুন
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Protected content loaded');
  });
})();
`;
  
  // ১১. ওবফুসকেটেড ফাইল সেভ করুন
  fs.writeFileSync('public/obfuscated.js', loaderCode);
  console.log('✅ JavaScript obfuscated successfully');
}

// ১২. সব কাজ একসাথে করুন
async function build() {
  await minifyHtml();
  obfuscateScripts();
  console.log('✅ Build completed!');
}

build();
