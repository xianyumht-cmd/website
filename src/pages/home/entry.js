import '../../assets/home/css/index.css';
import '../../assets/home/css/translation.css';
import '../../assets/home/js/translation.js';
import '../../assets/home/js/main.js';
import '../../assets/app/config.js';
import '../../assets/app/page-common.js';
import '../../../shared/anti-debug.js';
import cardIconUrl from '../../assets/home/picture/icon-card.svg';
import gameIconUrl from '../../assets/home/picture/icon-game.svg';
import { initCommonPage } from '../../assets/app/page-common.js';

initCommonPage();

const cardImage = document.querySelector('#qunliao1 .img img');
if (cardImage) cardImage.src = cardIconUrl;
const gameImage = document.querySelector('#qunliao3 .img img');
if (gameImage) gameImage.src = gameIconUrl;
