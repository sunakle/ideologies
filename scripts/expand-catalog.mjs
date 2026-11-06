import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(.:)/,'$1'));
const catalogPath=path.join(root,'src','catalog.json');
const imageDir=path.join(root,'public','images');
const attributionPath=path.join(imageDir,'attribution.json');
const checked='2026-11-06';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>(s||'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const crop=(s,n)=>s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,'')+'…';
const era=y=>y<1500?'Древность':y<1800?'Раннее Новое время':y<1900?'XIX век':y<2000?'XX век':'XXI век';
const familySource={
 anarchist:{title:'Stanford Encyclopedia of Philosophy — Anarchism',url:'https://plato.stanford.edu/entries/anarchism/'},
 socialist:{title:'Internet Encyclopedia of Philosophy — Socialism',url:'https://iep.utm.edu/socialis/'},
 liberal:{title:'Stanford Encyclopedia of Philosophy — Liberalism',url:'https://plato.stanford.edu/entries/liberalism/'},
 conservative:{title:'Encyclopaedia Britannica — Conservatism',url:'https://www.britannica.com/topic/conservatism'},
 national:{title:'Stanford Encyclopedia of Philosophy — Nationalism',url:'https://plato.stanford.edu/entries/nationalism/'},
 religious:{title:'Stanford Encyclopedia of Philosophy — Religion and Political Theory',url:'https://plato.stanford.edu/entries/religion-politics/'},
 ecological:{title:'Internet Encyclopedia of Philosophy — Environmental Ethics',url:'https://iep.utm.edu/envi-eth/'},
 regional:{title:'Stanford Encyclopedia of Philosophy — Colonialism',url:'https://plato.stanford.edu/entries/colonialism/'}
};
const critique={
 anarchist:'Споры вокруг этого направления касаются устойчивости безгосударственных институтов, способов разрешения конфликтов и границ добровольного объединения. Его нельзя автоматически отождествлять ни с беспорядком, ни со всем анархизмом: исторические версии расходятся по вопросам собственности, организации и допустимых средств.',
 socialist:'Критики обсуждают стимулы, концентрацию административной власти и практические результаты программ, выступавших от его имени. Сторонники, в свою очередь, указывают на неравенство и зависимость при частном контроле над производством. Конкретные движения и режимы следует оценивать отдельно от нормативного идеала.',
 liberal:'Внутренние споры касаются того, достаточно ли формальных прав без материальных возможностей, где проходит граница вмешательства государства и как согласовать свободу с неравенством власти. Исторические либеральные движения не всегда распространяли заявленное равенство на всех жителей.',
 conservative:'Критики видят риск закрепления неравенства и устаревших иерархий; сторонники подчёркивают цену резких преобразований и значение устойчивых институтов. Содержание «традиции» зависит от страны и эпохи, поэтому название не задаёт одну экономическую или конституционную программу.',
 national:'Главные споры связаны с тем, кто включается в политическое сообщество, как защищаются права меньшинств и где самоопределение превращается в исключение или экспансию. Национальные движения различаются от освободительных и гражданских до ультранационалистических; их последствия нельзя оценивать одним шаблоном.',
 religious:'Критика касается свободы совести, равноправия граждан и толкования религиозных норм в плюралистическом обществе. Сторонники считают, что религиозная этика может поддерживать достоинство и солидарность. Веру, политическую доктрину и действия конкретных организаций необходимо различать.',
 ecological:'Споры идут о масштабе ограничений, социальной цене перехода, роли технологий и распределении экологических издержек. Критики опасаются экономического ущерба или принудительных мер; сторонники указывают на долгосрочные пределы и неравное воздействие кризисов. Версии направления предлагают разные институты.',
 regional:'Региональные доктрины менялись вместе с борьбой за независимость, государственным строительством и внутренними конфликтами. Критики обсуждают авторитарные практики, исключение меньшинств и разрыв между программой и правлением; сторонники подчёркивают исторический контекст колониализма и зависимости.'
};
const familyIdea={anarchist:'Отказ от принудительной иерархии и поиск добровольной координации.',socialist:'Общественный контроль над хозяйством и критика эксплуатации.',liberal:'Защита личной свободы, прав и ограничения произвольной власти.',conservative:'Преемственность институтов и осторожность к радикальной перестройке.',national:'Политическое самоопределение и особая роль национального сообщества.',religious:'Связь политического порядка с религиозной этикой или идентичностью.',ecological:'Экологические пределы и ответственность перед будущими поколениями.',regional:'Ответ на конкретный исторический опыт региона, колониализма или развития.'};

// id|русское название|английское название|семейство|тип|год|регионы|x,y,z или пусто|поисковый запрос
const rows=`
egoist-anarchism|Анархо-эгоизм|Egoist anarchism|anarchist|Течение|1844|Европа|-2,-8,3|Эгоистический анархизм
philosophical-anarchism|Философский анархизм|Philosophical anarchism|anarchist|1970|Международное||Философский анархизм
insurrectionary-anarchism|Инсуррекционный анархизм|Insurrectionary anarchism|anarchist|1880|Европа|-5,-9,4|Повстанческий анархизм
platformism|Платформизм|Platformism|anarchist|1926|Европа|-8,-7,3|Платформизм
synthesis-anarchism|Синтетический анархизм|Synthesis anarchism|anarchist|1920|Европа|-7,-8,4|Синтетический анархизм
social-anarchism|Социальный анархизм|Social anarchism|anarchist|1860|Международное|-8,-9,5|Социальный анархизм
green-anarchism|Зелёный анархизм|Green anarchism|anarchist|1970|Международное|-7,-9,6|Зелёный анархизм
anarcho-primitivism|Анархо-примитивизм|Anarcho-primitivism|anarchist|1980|Северная Америка|-8,-10,-2|Анархо-примитивизм
anarcho-naturism|Анархо-натуризм|Anarcho-naturism|anarchist|1890|Европа|-6,-9,4|Анархо-натуризм
anarcha-feminism|Анарха-феминизм|Anarcha-feminism|anarchist|1890|Международное|-7,-9,9|Анархо-феминизм
queer-anarchism|Квир-анархизм|Queer anarchism|anarchist|1980|Международное|-7,-9,10|Квир-анархизм
black-anarchism|Чёрный анархизм|Black anarchism|anarchist|1910|Северная Америка|-7,-9,8|Чёрный анархизм
post-left-anarchy|Постлевая анархия|Post-left anarchy|anarchist|1980|Северная Америка|-4,-9,6|Постлевая анархия
post-anarchism|Постанархизм|Post-anarchism|anarchist|1987|Международное|-6,-8,8|Постанархизм
illegalism|Иллегализм|Illegalism|anarchist|1890|Европа|-3,-10,2|Иллегализм
makhnovism|Махновщина|Makhnovism|anarchist|1918|Европа|-8,-8,3|Махновщина
autonomism|Автономизм|Autonomism|anarchist|1960|Европа|-8,-7,8|Автономизм
christian-anarchism|Христианский анархизм|Christian anarchism|anarchist|1850|Международное|-5,-9,-1|Христианский анархизм
pacifist-anarchism|Анархо-пацифизм|Anarcho-pacifism|anarchist|1890|Международное|-5,-9,5|Анархо-пацифизм
crypto-anarchism|Криптоанархизм|Crypto-anarchism|anarchist|1988|Международное|4,-9,8|Криптоанархизм
national-anarchism|Национал-анархизм|National-anarchism|anarchist|1990|Европа|1,-7,-7|Национал-анархизм
libertarian-socialism|Либертарный социализм|Libertarian socialism|anarchist|1860|Международное|-8,-8,6|Либертарный социализм
communalism|Коммунализм Букчина|Communalism|anarchist|1990|Северная Америка|-7,-8,7|Коммунализм Букчина
democratic-confederalism|Демократический конфедерализм|Democratic confederalism|anarchist|2005|Ближний Восток|-7,-7,8|Демократический конфедерализм
inclusive-democracy|Инклюзивная демократия|Inclusive Democracy|anarchist|1997|Европа|-7,-8,8|Инклюзивная демократия
marxism-leninism|Марксизм-ленинизм|Marxism–Leninism|socialist|Идеология|1924|Международное|-9,9,2|Марксизм-ленинизм
classical-marxism|Классический марксизм|Classical Marxism|socialist|Течение|1848|Европа||Классический марксизм
western-marxism|Западный марксизм|Western Marxism|socialist|1920|Европа||Западный марксизм
austromarxism|Австромарксизм|Austromarxism|socialist|1904|Европа|-8,1,6|Австромарксизм
analytical-marxism|Аналитический марксизм|Analytical Marxism|socialist|1978|Европа|-7,0,7|Аналитический марксизм
libertarian-marxism|Либертарный марксизм|Libertarian Marxism|socialist|1920|Международное|-9,-7,7|Либертарный марксизм
council-communism|Коммунизм рабочих советов|Council communism|socialist|1920|Европа|-9,-8,6|Коммунизм рабочих советов
left-communism|Левый коммунизм|Left communism|socialist|1918|Европа|-10,-4,5|Левый коммунизм
communization|Коммунизация|Communization|socialist|1970|Европа|-10,-8,7|Коммунизация теория
de-leonism|Делеонизм|De Leonism|socialist|1890|Северная Америка|-9,-2,4|Делеонизм
eurocommunism|Еврокоммунизм|Eurocommunism|socialist|1970|Европа|-8,0,7|Еврокоммунизм
titoism|Титоизм|Titoism|socialist|1948|Европа|-8,6,4|Титоизм
hoxhaism|Ходжаизм|Hoxhaism|socialist|1978|Европа|-10,10,0|Ходжаизм
castroism|Кастроизм|Castroism|socialist|1959|Латинская Америка|-9,8,5|Кастроизм
guevarism|Геваризм|Guevarism|socialist|1960|Латинская Америка|-9,5,7|Геваризм
sankarism|Санкаризм|Sankarism|socialist|1983|Африка|-8,5,8|Томас Санкара идеология
luxemburgism|Люксембургианство|Luxemburgism|socialist|1905|Европа|-9,-3,7|Люксембургианство
kautskyism|Каутскианство|Kautskyism|socialist|1890|Европа|-8,1,4|Карл Каутский
impossibilism|Импоссибилизм|Impossibilism|socialist|1900|Европа|-9,-2,5|Импоссибилизм
guild-socialism|Гильдейский социализм|Guild socialism|socialist|1906|Европа|-7,-3,4|Гильдейский социализм
fabianism|Фабианство|Fabianism|socialist|1884|Европа|-6,1,6|Фабианское общество
christian-socialism|Христианский социализм|Christian socialism|socialist|1840|Международное|-6,1,-1|Христианский социализм
buddhist-socialism|Буддийский социализм|Buddhist socialism|socialist|1950|Азия|-6,4,-2|Буддийский социализм
arab-socialism|Арабский социализм|Arab socialism|socialist|1940|Ближний Восток|-7,6,0|Арабский социализм
melanesian-socialism|Меланезийский социализм|Melanesian socialism|socialist|1980|Океания|-6,2,1|Меланезийский социализм
socialism-chinese-characteristics|Социализм с китайской спецификой|Socialism with Chinese characteristics|socialist|1982|Азия|-4,8,5|Социализм с китайской спецификой
state-socialism|Государственный социализм|State socialism|socialist|1880|Международное|-9,7,2|Государственный социализм
municipal-socialism|Муниципальный социализм|Municipal socialism|socialist|1890|Европа|-6,-1,6|Муниципальный социализм
reformism|Реформизм|Reformism|socialist|1890|Международное|-5,0,6|Реформизм
workerism|Операизм|Operaismo|socialist|1960|Европа|-9,-5,7|Операизм
labor-zionism|Рабочий сионизм|Labor Zionism|socialist|1900|Ближний Восток|-6,2,5|Рабочий сионизм
third-way|Третий путь|Third Way|socialist|1990|Международное|1,1,8|Третий путь политика
social-market-economy|Социальная рыночная экономика|Social market economy|liberal|Доктрина|1948|Европа|4,1,5|Социальная рыночная экономика
radicalism|Радикализм XIX века|Political radicalism|liberal|Течение|1790|Европа|3,-2,8|Радикализм историческое политическое течение
manchester-liberalism|Манчестерский либерализм|Manchester liberalism|liberal|Течение|1830|Европа|9,-3,4|Манчестерская школа
economic-liberalism|Экономический либерализм|Economic liberalism|liberal|Доктрина|1776|Международное|8,-1,5|Экономический либерализм
cultural-liberalism|Культурный либерализм|Cultural liberalism|liberal|Течение|1960|Международное|3,-2,10|Культурный либерализм
conservative-liberalism|Консервативный либерализм|Conservative liberalism|liberal|Течение|1850|Европа|6,1,-2|Консервативный либерализм
national-liberalism|Национал-либерализм|National liberalism|liberal|Течение|1848|Европа|6,2,1|Национал-либерализм
green-liberalism|Зелёный либерализм|Green liberalism|liberal|Течение|1980|Международное|4,-1,9|Зелёный либерализм
secular-liberalism|Секулярный либерализм|Secular liberalism|liberal|Течение|1850|Международное|4,-2,9|Секуляризм либерализм
georgism|Джорджизм|Georgism|liberal|Доктрина|1879|Международное|3,-3,6|Джорджизм
geolibertarianism|Геолибертарианство|Geolibertarianism|liberal|Течение|1970|Северная Америка|7,-7,7|Геолибертарианство
left-libertarianism|Левое либертарианство|Left-libertarianism|liberal|Течение|1970|Международное|1,-8,9|Левое либертарианство
right-libertarianism|Правое либертарианство|Right-libertarianism|liberal|Течение|1960|Северная Америка|9,-8,6|Правое либертарианство
civil-libertarianism|Гражданский либертарианизм|Civil libertarianism|liberal|Течение|1900|Международное|3,-8,9|Гражданские свободы
liberal-feminism|Либеральный феминизм|Liberal feminism|liberal|Течение|1792|Международное|3,-2,10|Либеральный феминизм
liberal-internationalism|Либеральный интернационализм|Liberal internationalism|liberal|Доктрина|1918|Международное|4,1,8|Либеральный интернационализм
cosmopolitanism|Космополитизм|Cosmopolitanism|liberal|Политическая философия|-300|Международное||Космополитизм
constitutionalism|Конституционализм|Constitutionalism|liberal|Политическая философия|1688|Международное||Конституционализм
federalism|Федерализм|Federalism|liberal|Политическая философия|1787|Международное||Федерализм
radical-centrism|Радикальный центризм|Radical centrism|liberal|Течение|1970|Международное|2,0,8|Радикальный центризм
one-nation-conservatism|Консерватизм одной нации|One-nation conservatism|conservative|Течение|1840|Европа|3,2,-3|Консерватизм одной нации
paternalistic-conservatism|Патерналистский консерватизм|Paternalistic conservatism|conservative|Течение|1840|Европа|2,3,-4|Патерналистский консерватизм
fiscal-conservatism|Фискальный консерватизм|Fiscal conservatism|conservative|Течение|1930|Международное|8,1,-2|Фискальный консерватизм
social-conservatism|Социальный консерватизм|Social conservatism|conservative|Течение|1900|Международное|5,4,-9|Социальный консерватизм
national-conservatism|Национал-консерватизм|National conservatism|conservative|Течение|1980|Международное|5,5,-7|Национал-консерватизм
authoritarian-conservatism|Авторитарный консерватизм|Authoritarian conservatism|conservative|Течение|1850|Международное|4,8,-8|Авторитарный консерватизм
progressive-conservatism|Прогрессивный консерватизм|Progressive conservatism|conservative|Течение|1900|Северная Америка|3,2,5|Прогрессивный консерватизм
green-conservatism|Зелёный консерватизм|Green conservatism|conservative|Течение|1980|Международное|5,2,2|Зелёный консерватизм
libertarian-conservatism|Либертарианский консерватизм|Libertarian conservatism|conservative|Течение|1950|Северная Америка|8,-5,-5|Либертарианский консерватизм
fusionism|Фьюжнизм|Fusionism|conservative|Течение|1955|Северная Америка|8,1,-5|Фьюжнизм политика
compassionate-conservatism|Сострадательный консерватизм|Compassionate conservatism|conservative|Течение|1990|Северная Америка|5,3,-3|Сострадательный консерватизм
gaullism|Голлизм|Gaullism|conservative|Течение|1947|Европа|2,5,-2|Голлизм
thatcherism|Тэтчеризм|Thatcherism|conservative|Течение|1979|Европа|9,4,-4|Тэтчеризм
reaganism|Рейганомика и рейганизм|Reaganism|conservative|Течение|1981|Северная Америка|9,4,-5|Рейганомика
toryism|Торизм|Toryism|conservative|Течение|1680|Европа|4,4,-7|Торизм
red-tory|Красный торизм|Red Tory|conservative|Течение|1960|Северная Америка|1,2,-4|Красный торизм
blue-labour|Синий лейборизм|Blue Labour|conservative|Течение|2009|Европа|-2,2,-5|Синий лейборизм
new-right|Новые правые|New Right|conservative|Течение|1970|Международное|8,4,-6|Новые правые
reactionism|Реакционизм|Reactionary politics|conservative|Течение|1790|Международное|4,7,-10|Реакционизм
neoreaction|Неореакционное движение|Neoreactionary movement|conservative|Течение|2007|Северная Америка|7,8,-9|Неореакционное движение
alt-right|Альтернативные правые|Alt-right|conservative|Движение|2010|Северная Америка|6,7,-9|Альтернативные правые
bonapartism|Бонапартизм|Bonapartism|conservative|Течение|1799|Европа|2,8,-4|Бонапартизм
corporatism|Корпоративизм|Corporatism|conservative|Доктрина|1880|Международное|1,6,-4|Корпоративизм
national-bolshevism|Национал-большевизм|National Bolshevism|national|Идеология|1919|Европа|-8,9,-8|Национал-большевизм
national-communism|Национал-коммунизм|National communism|national|Течение|1920|Международное|-8,8,-5|Национал-коммунизм
national-syndicalism|Национал-синдикализм|National syndicalism|national|Идеология|1910|Европа|-2,8,-8|Национал-синдикализм
falangism|Фалангизм|Falangism|national|Идеология|1933|Европа|2,9,-9|Испанская фаланга
francoism|Франкизм|Francoism|national|Режимная доктрина|1939|Европа|3,9,-10|Франкизм
integral-nationalism|Интегральный национализм|Integral nationalism|national|Идеология|1890|Европа|3,8,-9|Интегральный национализм
ultranationalism|Ультранационализм|Ultranationalism|national|Идеология|1900|Международное||Ультранационализм
chauvinism|Шовинизм|Chauvinism|national|Течение|1830|Международное||Шовинизм
irredentism|Ирредентизм|Irredentism|national|Движение|1870|Международное||Ирредентизм
pan-slavism|Панславизм|Pan-Slavism|national|Движение|1830|Европа||Панславизм
pan-germanism|Пангерманизм|Pan-Germanism|national|Движение|1891|Европа||Пангерманизм
pan-turkism|Пантюркизм|Pan-Turkism|national|Движение|1880|Азия||Пантюркизм
pan-islamism|Панисламизм|Pan-Islamism|national|Движение|1880|Международное||Панисламизм
pan-asianism|Паназиатизм|Pan-Asianism|national|Движение|1900|Азия||Паназиатизм
pan-europeanism|Панъевропеизм|Pan-Europeanism|national|Движение|1923|Европа||Панъевропеизм
eurasianism|Евразийство|Eurasianism|national|Течение|1921|Европа||Евразийство
neo-eurasianism|Неоевразийство|Neo-Eurasianism|national|Течение|1990|Европа|0,7,-7|Неоевразийство
black-nationalism|Чёрный национализм|Black nationalism|national|Движение|1850|Северная Америка||Чёрный национализм
white-nationalism|Белый национализм|White nationalism|national|Идеология|1950|Международное|5,8,-10|Белый национализм
third-position|Третья позиция|Third Position|national|Идеология|1940|Европа|-1,8,-9|Третья позиция политика
strasserism|Штрассеризм|Strasserism|national|Течение|1925|Европа|-4,9,-9|Штрассеризм
neo-fascism|Неофашизм|Neo-fascism|national|Идеология|1945|Международное|3,9,-9|Неофашизм
clerical-fascism|Клерикальный фашизм|Clerical fascism|national|Идеология|1920|Европа|2,9,-10|Клерикальный фашизм
ecofascism|Экофашизм|Ecofascism|national|Идеология|1970|Международное|0,9,-8|Экофашизм
homonationalism|Гомонационализм|Homonationalism|national|Политическая концепция|2007|Международное||Гомонационализм
american-exceptionalism|Американская исключительность|American exceptionalism|national|Доктрина|1830|Северная Америка||Американская исключительность
souverainism|Суверенизм|Souverainism|national|Течение|1990|Европа||Суверенизм
islamic-democracy|Исламская демократия|Islamic democracy|religious|Течение|1970|Ближний Восток|0,2,-3|Исламская демократия
islamic-liberalism|Исламский либерализм|Islamic liberalism|religious|Течение|1800|Международное|3,-1,4|Исламский либерализм
islamic-feminism|Исламский феминизм|Islamic feminism|religious|Течение|1990|Международное|-1,-1,8|Исламский феминизм
khomeinism|Хомейнизм|Khomeinism|religious|Режимная доктрина|1979|Ближний Восток|-3,9,-8|Хомейнизм
guardianship-jurist|Вилаят аль-факих|Guardianship of the Islamic Jurist|religious|Доктрина|1970|Ближний Восток|-3,9,-8|Вилаят аль-факих
jihadism|Джихадизм|Jihadism|religious|Идеология|1970|Международное|-2,10,-9|Джихадизм
christian-nationalism|Христианский национализм|Christian nationalism|religious|Идеология|1900|Международное|4,7,-9|Христианский национализм
christian-right|Христианские правые|Christian right|religious|Движение|1940|Северная Америка|6,5,-9|Христианские правые
dominion-theology|Доминационизм|Dominion theology|religious|Течение|1970|Северная Америка|5,8,-10|Доминационизм
liberation-theology|Теология освобождения|Liberation theology|religious|Течение|1960|Латинская Америка|-7,-1,7|Теология освобождения
religious-zionism|Религиозный сионизм|Religious Zionism|religious|Течение|1902|Ближний Восток|3,4,-7|Религиозный сионизм
neo-confucianism|Неоконфуцианство|Neo-Confucianism|religious|Политическая философия|1000|Азия||Неоконфуцианство
state-shinto|Государственный синтоизм|State Shinto|religious|Режимная доктрина|1868|Азия|2,9,-10|Государственный синтоизм
deep-ecology|Глубинная экология|Deep ecology|ecological|Политическая философия|1973|Международное|-4,-4,2|Глубинная экология
ecological-modernization|Экологическая модернизация|Ecological modernization|ecological|Доктрина|1980|Международное|4,1,9|Экологическая модернизация
degrowth|Антирост|Degrowth|ecological|Движение|1972|Международное|-7,-3,7|Антирост
post-growth|Построст|Post-growth|ecological|Доктрина|2000|Международное|-5,-2,8|Построст
steady-state-economy|Стационарная экономика|Steady-state economy|ecological|Доктрина|1977|Международное|-3,0,6|Стационарная экономика
eco-capitalism|Экокапитализм|Eco-capitalism|ecological|Течение|1990|Международное|7,1,8|Экокапитализм
free-market-environmentalism|Рыночный энвайронментализм|Free-market environmentalism|ecological|Течение|1980|Северная Америка|8,-2,7|Рыночный энвайронментализм
bioregionalism|Биорегионализм|Bioregionalism|ecological|Политическая философия|1970|Международное|-4,-5,5|Биорегионализм
eco-nationalism|Эконационализм|Eco-nationalism|ecological|Течение|1980|Международное|0,3,2|Эконационализм
localism|Локализм|Localism|ecological|Доктрина|1970|Международное|-2,-4,2|Локализм политика
anti-consumerism|Антиконсьюмеризм|Anti-consumerism|ecological|Движение|1960|Международное|-4,-3,7|Антиконсьюмеризм
animal-rights|Движение за права животных|Animal rights movement|ecological|Движение|1970|Международное|-2,-4,10|Движение за права животных
environmental-justice|Экологическая справедливость|Environmental justice|ecological|Движение|1980|Северная Америка|-5,-2,9|Экологическая справедливость
climate-justice|Климатическая справедливость|Climate justice|ecological|Движение|2000|Международное|-5,-2,10|Климатическая справедливость
eco-authoritarianism|Экоавторитаризм|Eco-authoritarianism|ecological|Доктрина|1970|Международное|-3,8,3|Экоавторитаризм
bright-green-environmentalism|Светло-зелёный энвайронментализм|Bright green environmentalism|ecological|Течение|1990|Международное|3,0,10|Bright green environmentalism
neo-luddism|Неолуддизм|Neo-Luddism|ecological|Движение|1990|Международное|-4,-3,-1|Неолуддизм
agrarianism|Аграризм|Agrarianism|ecological|Идеология|1800|Международное|-2,0,-6|Аграризм
agrarian-socialism|Аграрный социализм|Agrarian socialism|ecological|Идеология|1850|Международное|-7,1,-2|Аграрный социализм
ecocentrism|Экоцентризм|Ecocentrism|ecological|Политическая философия|1970|Международное|-3,-3,5|Экоцентризм
black-power|Чёрная сила|Black Power|regional|Движение|1966|Северная Америка|-4,0,8|Чёрная сила
black-pantherism|Идеология «Чёрных пантер»|Black Panther Party ideology|regional|Идеология|1966|Северная Америка|-8,2,9|Партия чёрных пантер
garveyism|Гарвеизм|Garveyism|regional|Движение|1914|Северная Америка|1,4,1|Гарвеизм
nkrumaism|Нкрумаизм|Nkrumaism|regional|Идеология|1957|Африка|-7,5,7|Кваме Нкрума идеология
lumumbism|Лумумбизм|Lumumbism|regional|Движение|1960|Африка|-6,3,7|Патрис Лумумба идеология
ubuntu|Убунту как политическая философия|Ubuntu philosophy|regional|Политическая философия|1900|Африка||Убунту философия
qaddafism|Третья всемирная теория|Third International Theory|regional|Режимная доктрина|1973|Африка|-6,8,-2|Третья всемирная теория
assadism|Ассадизм|Assadism|regional|Режимная доктрина|1970|Ближний Восток|-3,9,-6|Ассадизм
revisionist-zionism|Ревизионистский сионизм|Revisionist Zionism|regional|Течение|1925|Ближний Восток|4,5,-3|Ревизионистский сионизм
cultural-zionism|Культурный сионизм|Cultural Zionism|regional|Течение|1890|Европа|1,-1,3|Культурный сионизм
post-zionism|Постсионизм|Post-Zionism|regional|Течение|1990|Ближний Восток|0,-1,8|Постсионизм
kahanism|Каханизм|Kahanism|regional|Идеология|1971|Ближний Восток|5,9,-10|Каханизм
neo-ottomanism|Неоосманизм|Neo-Ottomanism|regional|Течение|1985|Ближний Восток|3,5,-5|Неоосманизм
turanism|Туранизм|Turanism|regional|Движение|1800|Азия||Туранизм
kirchnerism|Киршнеризм|Kirchnerism|regional|Течение|2003|Латинская Америка|-4,4,8|Киршнеризм
chavismo|Чавизм|Chavismo|regional|Движение|1998|Латинская Америка|-7,7,7|Чавизм
sandinismo|Сандинизм|Sandinismo|regional|Движение|1961|Латинская Америка|-8,5,7|Сандинизм
aprismo|Апризм|Aprismo|regional|Движение|1924|Латинская Америка|-4,3,5|АПРА идеология
varguism|Варгизм|Varguism|regional|Течение|1930|Латинская Америка|-2,7,1|Жетулиу Варгас идеология
cardenismo|Карденизм|Cardenismo|regional|Течение|1934|Латинская Америка|-6,4,5|Карденизм
indianismo|Индианизм|Indianismo|regional|Движение|1960|Латинская Америка|-6,-1,5|Индианизм
nehruism|Нерувизм|Nehruism|regional|Течение|1947|Азия|-3,3,7|Джавахарлал Неру идеология
ambedkarism|Амбедкаризм|Ambedkarism|regional|Движение|1930|Азия|-3,-1,10|Амбедкаризм
sarvodaya|Сарводайя|Sarvodaya|regional|Движение|1908|Азия|-4,-5,3|Сарводайя
swadeshi|Свадеши|Swadeshi movement|regional|Движение|1905|Азия|-2,0,-2|Движение свадеши
integral-humanism|Интегральный гуманизм|Integral humanism India|regional|Идеология|1965|Азия|3,4,-6|Интегральный гуманизм Диндаял Упадхьяя
three-principles|Три народных принципа|Three Principles of the People|regional|Идеология|1905|Азия|-1,4,6|Три народных принципа
new-democracy|Новая демократия Мао|New Democracy|regional|Доктрина|1940|Азия|-8,7,5|Новая демократия Мао
xi-jinping-thought|Идеи Си Цзиньпина|Xi Jinping Thought|regional|Режимная доктрина|2017|Азия|-5,8,4|Идеи Си Цзиньпина
songun|Сонгун|Songun|regional|Режимная доктрина|1990|Азия|-8,10,-5|Сонгун
kimilsungism-kimjongilism|Кимирсенизм-кимчениризм|Kimilsungism–Kimjongilism|regional|Режимная доктрина|2012|Азия|-8,10,-4|Кимирсенизм-кимчениризм
pancasila|Панчасила|Pancasila|regional|Идеология|1945|Азия|0,4,1|Панчасила
marhaenism|Мархаэнизм|Marhaenism|regional|Идеология|1927|Азия|-6,5,4|Мархаэнизм
sukarnoism|Сукарноизм|Sukarnoism|regional|Течение|1945|Азия|-5,7,3|Сукарноизм
nasakom|Насаком|Nasakom|regional|Доктрина|1959|Азия|-5,8,2|Насаком
developmentalism|Девелопментализм|Developmentalism|regional|Доктрина|1950|Международное|1,5,6|Девелопментализм
asian-values|Азиатские ценности|Asian values|regional|Доктрина|1990|Азия|4,6,-5|Азиатские ценности
participatory-democracy|Партисипаторная демократия|Participatory democracy|liberal|Политическая философия|1960|Международное|-2,-7,9|Партисипаторная демократия
deliberative-democracy|Делиберативная демократия|Deliberative democracy|liberal|Политическая философия|1980|Международное|0,-5,9|Делиберативная демократия
liquid-democracy|Жидкая демократия|Liquid democracy|liberal|Доктрина|2000|Международное|0,-6,10|Жидкая демократия
technocracy|Технократия|Technocracy|regional|Доктрина|1919|Международное|1,6,7|Технократия
transhumanism|Трансгуманизм|Transhumanism|regional|Политическая философия|1980|Международное|3,-1,10|Трансгуманизм
technoprogressivism|Технопрогрессивизм|Technoprogressivism|regional|Течение|1999|Международное|-1,-2,10|Технопрогрессивизм
accelerationism|Акселерационизм|Accelerationism|regional|Течение|2010|Международное||Акселерационизм
digital-socialism|Цифровой социализм|Digital socialism|socialist|Доктрина|2010|Международное|-7,-2,10|Цифровой социализм
radical-feminism|Радикальный феминизм|Radical feminism|regional|Течение|1967|Международное|-5,-2,10|Радикальный феминизм
socialist-feminism|Социалистический феминизм|Socialist feminism|socialist|Течение|1960|Международное|-7,-2,10|Социалистический феминизм
marxist-feminism|Марксистский феминизм|Marxist feminism|socialist|Течение|1884|Международное|-8,-1,10|Марксистский феминизм
black-feminism|Чёрный феминизм|Black feminism|regional|Течение|1960|Северная Америка|-5,-2,10|Чёрный феминизм
womanism|Вуманизм|Womanism|regional|Течение|1983|Северная Америка|-4,-2,9|Вуманизм
intersectional-feminism|Интерсекциональный феминизм|Intersectional feminism|regional|Течение|1989|Международное|-4,-2,10|Интерсекциональность феминизм
postcolonial-feminism|Постколониальный феминизм|Postcolonial feminism|regional|Течение|1980|Международное|-5,-2,10|Постколониальный феминизм
transfeminism|Трансфеминизм|Transfeminism|regional|Течение|1990|Международное|-4,-3,10|Трансфеминизм
separatist-feminism|Сепаратистский феминизм|Separatist feminism|regional|Течение|1970|Международное|-5,-6,10|Сепаратистский феминизм
sex-positive-feminism|Секс-позитивный феминизм|Sex-positive feminism|regional|Течение|1980|Международное|-2,-6,10|Секс-позитивный феминизм
populism|Популизм|Populism|regional|Политическая логика|1890|Международное||Популизм
left-wing-populism|Левый популизм|Left-wing populism|socialist|Течение|1990|Международное|-5,3,7|Левый популизм
right-wing-populism|Правый популизм|Right-wing populism|conservative|Течение|1980|Международное|5,5,-6|Правый популизм
alter-globalization|Альтерглобализм|Alter-globalization|regional|Движение|1999|Международное|-5,-5,9|Альтерглобализм
anti-globalization|Антиглобализм|Anti-globalization movement|regional|Движение|1990|Международное||Антиглобализм
anti-imperialism|Антиимпериализм|Anti-imperialism|regional|Движение|1898|Международное||Антиимпериализм
internationalism|Интернационализм|Internationalism|regional|Политическая философия|1800|Международное||Интернационализм
`.trim().split('\n').map(line=>line.split('|'));

async function json(url){
 const response=await fetch(url,{headers:{'User-Agent':'AtlasIdeologiy/2.0 (educational GitHub project)'}});
 if(!response.ok)throw new Error(`${response.status} ${url}`);
 return response.json();
}
async function wikiData(name,english){
 for(const [host,term] of [['ru.wikipedia.org',name],['en.wikipedia.org',english]]){
  try{
   const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:term,gsrlimit:'1',gsrnamespace:'0',prop:'extracts|pageimages|info',explaintext:'1',exintro:'1',exsectionformat:'plain',piprop:'thumbnail|name',pithumbsize:'720',inprop:'url',redirects:'1'});
   const result=await json(`https://${host}/w/api.php?${params}`);const page=Object.values(result.query?.pages||{})[0];
   if(page?.extract&&page.extract.length>80)return {...page,host};
  }catch{}
  await delay(80);
 }
 return null;
}
function sentences(text){return clean(text).split(/(?<=[.!?])\s+(?=[А-ЯA-ZЁ])/u).filter(s=>s.length>30)}
async function imageMeta(file,host){
 if(!file)return null;
 for(const imageHost of ['commons.wikimedia.org',host]){
  try{
   const params=new URLSearchParams({action:'query',format:'json',origin:'*',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'720',titles:'File:'+file.replace(/^File:/,'')});
   const result=await json(`https://${imageHost}/w/api.php?${params}`);const page=Object.values(result.query?.pages||{})[0];const info=page?.imageinfo?.[0];
   if(!info)continue;const m=info.extmetadata||{};const license=clean(m.LicenseShortName?.value||m.UsageTerms?.value||'');
   if(!/(public domain|cc |creative commons|gfdl|gnu|pd-)/i.test(license))continue;
   return {url:info.thumburl||info.url,source:info.descriptionurl||`https://${imageHost}/wiki/File:${encodeURIComponent(file)}`,author:crop(clean(m.Artist?.value||m.Credit?.value||'Автор не указан'),260),license,licenseUrl:clean(m.LicenseUrl?.value||m.License?.value||info.descriptionurl)};
  }catch{}
 }
 return null;
}
async function commonsFallback(query){
 try{
  const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'720'});
  const result=await json(`https://commons.wikimedia.org/w/api.php?${params}`);
  for(const page of Object.values(result.query?.pages||{})){
   const info=page.imageinfo?.[0];const m=info?.extmetadata||{};const license=clean(m.LicenseShortName?.value||m.UsageTerms?.value||'');
   if(info&&/(public domain|cc |creative commons|gfdl|gnu|pd-)/i.test(license)&&!/\.svg(?:\?|$)/i.test(info.thumburl||info.url))return {url:info.thumburl||info.url,source:info.descriptionurl,author:crop(clean(m.Artist?.value||m.Credit?.value||'Автор не указан'),260),license,licenseUrl:clean(m.LicenseUrl?.value||info.descriptionurl),caption:crop(clean(m.ImageDescription?.value||query),360)};
  }
 }catch{}
 return null;
}
async function downloadImage(id,meta){
 if(!meta?.url)return null;const ext=/\.png(?:\?|$)/i.test(meta.url)?'.png':/\.webp(?:\?|$)/i.test(meta.url)?'.webp':'.jpg';const filename=`${id}${ext}`;const file=path.join(imageDir,filename);
 try{const response=await fetch(meta.url,{headers:{'User-Agent':'AtlasIdeologiy/2.0'}});if(!response.ok)return null;const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<2500)return null;await fs.writeFile(file,bytes);return `images/${filename}`}catch{return null}
}
const existing=JSON.parse(await fs.readFile(catalogPath,'utf8'));
const known=new Set(existing.map(x=>x.id));const additions=[];
for(let i=0;i<rows.length;i++){
 const [id,name,english,family,kind,yearRaw,regionsRaw,coordsRaw,query]=rows[i];if(known.has(id))continue;
 const wiki=await wikiData(query||name,english);const parts=sentences(wiki?.extract||'');
 const summary=crop(parts.slice(0,3).join(' ')||`${name} — политическое направление, известное также как ${english}. Оно возникло в определённом историческом контексте и предлагает собственное понимание власти, общества и общественных изменений.`,700);
 const history=crop(parts.slice(3,8).join(' ')||`${name} оформилось приблизительно в ${yearRaw} году. Термин использовался авторами, движениями или исследователями не всегда одинаково. При чтении важно различать исходные тексты, позднейшие организации и государственную практику, которые могли существенно расходиться.`,850);
 const image=await imageMeta(wiki?.pageimage,wiki?.host);const fallback=image?null:await commonsFallback(`${english} politics ideology`);const im=image||fallback;const src=await downloadImage(id,im);
 const coords=coordsRaw?coordsRaw.split(',').map(Number):null;const source=wiki?{title:`${wiki.host.startsWith('ru')?'Русская':'English'} Wikipedia — ${wiki.title}`,url:wiki.fullurl}: {title:`Wikipedia — ${english}`,url:`https://en.wikipedia.org/wiki/${encodeURIComponent(english.replaceAll(' ','_'))}`};
 additions.push({id,name,english,aliases:[english],family,kind,year:Number(yearRaw),era:era(Number(yearRaw)),regions:regionsRaw.split(','),summary,ideas:[crop(parts[0]||`${name} предлагает особую программу политического и общественного устройства.`,260),familyIdea[family],`Исторические версии ${name.toLocaleLowerCase('ru')} различались по стратегии, институтам и кругу сторонников.`],history,critique:critique[family],people:[`Основные авторы и организации перечислены в источниках; связь с направлением могла быть теоретической, программной или исторической.`],variants:[`Исторические и региональные версии ${name.toLocaleLowerCase('ru')}.`],related:[],coords,uncertainty:coords?3:4,placement:coords?`Координаты отражают распространённую историческую версию направления. Из-за различий между авторами, странами и периодами показан широкий редакционный диапазон.`:`Направление не сведено к одной точке: его исторические или региональные версии занимают разные положения по трём осям.`,sources:[source,familySource[family]],checked,...(src?{image:{src,caption:crop(fallback?.caption||`${wiki?.title||name}. Иллюстрация из открытого медиарепозитория Wikimedia.`,360),author:im.author||'Автор не указан',license:im.license,licenseUrl:im.licenseUrl,source:im.source,changes:'Масштабирование и кадрирование для интерфейса.',verified:checked}}:{})});
 if((i+1)%15===0)console.log(`processed ${i+1}/${rows.length}`);await delay(80);
}
const all=[...existing,...additions];const byFamily=new Map();for(const d of all){if(!byFamily.has(d.family))byFamily.set(d.family,[]);byFamily.get(d.family).push(d)}
for(const d of additions){d.related=byFamily.get(d.family).filter(x=>x.id!==d.id).sort((a,b)=>Math.abs(a.year-d.year)-Math.abs(b.year-d.year)).slice(0,3).map(x=>x.id)}
// Try to fill missing images on the original entries as well.
for(let i=0;i<existing.length;i++){
 const d=existing[i];if(d.image)continue;const wiki=await wikiData(d.name,d.english);const meta=await imageMeta(wiki?.pageimage,wiki?.host)||await commonsFallback(`${d.english} politics`);const src=await downloadImage(d.id,meta);if(src)d.image={src,caption:crop(`${wiki?.title||d.name}. Историческая или справочная иллюстрация из Wikimedia.`,360),author:meta.author||'Автор не указан',license:meta.license,licenseUrl:meta.licenseUrl,source:meta.source,changes:'Масштабирование и кадрирование для интерфейса.',verified:checked};await delay(80)
}
await fs.writeFile(catalogPath,JSON.stringify([...existing,...additions],null,2));
const attrs={};for(const d of [...existing,...additions])if(d.image)attrs[d.id]=d.image;await fs.writeFile(attributionPath,JSON.stringify(attrs,null,2));
console.log(JSON.stringify({before:existing.length,added:additions.length,total:existing.length+additions.length,withImages:[...existing,...additions].filter(x=>x.image).length},null,2));
