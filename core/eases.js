// Vitrin hareket eğrileri (animate skill'i): CSS'teki --ease-out ve --ease-in-out ile birebir aynı.
// Vitrin motoru ve ürün setleri ortak kullanır; eğri değerleri yalnız burada yazılır.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';

gsap.registerPlugin(CustomEase);
export const EASE_OUT = CustomEase.create('vOut', '0.23,1,0.32,1');       // giriş, çıkış
export const EASE = CustomEase.create('vEase', '0.25,0.1,0.25,1');        // renk değişimi (CSS "ease")
export const EASE_IN_OUT = CustomEase.create('vInOut', '0.77,0,0.175,1'); // ekranda yer değiştirme (kamera, döner tabla)
