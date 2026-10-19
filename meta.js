/* =========================================================================
 * meta.js — Temi + livelli CEFR per Mazzi di vocabolario
 * Da caricare DOPO data.js.
 * Aggiunge a ogni carta: { theme, level }  (in tutti i mazzi: en, es, fr, de)
 * Aggiunge 18 nuove carte inglesi: phrasal verbs + idioms.
 * ========================================================================= */

(function () {
  "use strict";

  if (typeof DECKS === "undefined") {
    console.error("[meta.js] DECKS non trovato. Carica data.js prima di meta.js.");
    return;
  }

  // ---------------------------------------------------------------------
  // 1. LIVELLI CEFR
  // ---------------------------------------------------------------------
  const LEVELS = [
    { id: "A1", name: "A1 – Principiante" },
    { id: "A2", name: "A2 – Elementare" },
    { id: "B1", name: "B1 – Intermedio" },
    { id: "B2", name: "B2 – Intermedio avanzato" },
    { id: "C1", name: "C1 – Avanzato" },
  ];

  // ---------------------------------------------------------------------
  // 2. TEMI
  // ---------------------------------------------------------------------
  const THEMES = [
    { id: "famiglia",              name: "Famiglia e persone",     emoji: "👪" },
    { id: "animali",               name: "Animali",                emoji: "🐕" },
    { id: "cibo",                  name: "Cibo e bevande",         emoji: "🍽️" },
    { id: "cucina_oggetti",        name: "Cucina e stoviglie",     emoji: "🍴" },
    { id: "corpo",                 name: "Corpo",                  emoji: "🫀" },
    { id: "corpo_organi",          name: "Organi interni",         emoji: "🫁" },
    { id: "salute",                name: "Salute e medicina",      emoji: "🏥" },
    { id: "colori",                name: "Colori",                 emoji: "🎨" },
    { id: "numeri_base",           name: "Numeri (1–10)",          emoji: "🔢" },
    { id: "numeri_grandi",         name: "Numeri grandi",          emoji: "💯" },
    { id: "forme",                 name: "Forme geometriche",      emoji: "🔷" },
    { id: "natura",                name: "Natura",                 emoji: "🌿" },
    { id: "natura_2",              name: "Paesaggi e ambiente",    emoji: "🏔️" },
    { id: "meteo",                 name: "Meteo",                  emoji: "🌤️" },
    { id: "stagioni",              name: "Stagioni",               emoji: "🍂" },
    { id: "casa",                  name: "Casa",                   emoji: "🏠" },
    { id: "elettrodomestici",      name: "Elettrodomestici",       emoji: "🧺" },
    { id: "vestiario",             name: "Vestiario e accessori",  emoji: "👕" },
    { id: "citta",                 name: "Città e luoghi",         emoji: "🏙️" },
    { id: "trasporti",             name: "Trasporti",              emoji: "🚗" },
    { id: "direzioni",             name: "Direzioni",              emoji: "➡️" },
    { id: "tempo_data",            name: "Tempo e date",           emoji: "📅" },
    { id: "giorni",                name: "Giorni della settimana", emoji: "🗓️" },
    { id: "mesi",                  name: "Mesi",                   emoji: "📆" },
    { id: "verbi_base",            name: "Verbi base",             emoji: "🏃" },
    { id: "verbi_azione",          name: "Verbi d'azione",         emoji: "🎬" },
    { id: "verbi_cambio",          name: "Verbi di movimento",     emoji: "🔀" },
    { id: "verbi_decisione",       name: "Verbi di decisione",     emoji: "✅" },
    { id: "verbi_sociali",         name: "Verbi sociali",          emoji: "💬" },
    { id: "verbi_riflessivi",      name: "Verbi riflessivi",       emoji: "🪞" },
    { id: "aggettivi_base",        name: "Aggettivi base",         emoji: "⭐" },
    { id: "aggettivi_personalita", name: "Personalità",            emoji: "🧠" },
    { id: "aggettivi_sapori",      name: "Sapori e consistenze",   emoji: "🧂" },
    { id: "aggettivi_valutativi",  name: "Aggettivi valutativi",   emoji: "🏆" },
    { id: "avverbi",               name: "Avverbi",                emoji: "🕐" },
    { id: "espressioni_saluti",    name: "Saluti",                 emoji: "👋" },
    { id: "espressioni_cortesia",  name: "Cortesia",               emoji: "🙏" },
    { id: "espressioni_quotidiane",name: "Espressioni quotidiane", emoji: "💬" },
    { id: "espressioni_ristorante",name: "Al ristorante",          emoji: "🍽️" },
    { id: "espressioni_viaggio",   name: "In viaggio",             emoji: "✈️" },
    { id: "espressioni_telefono",  name: "Al telefono",            emoji: "📞" },
    { id: "espressioni_reazioni",  name: "Reazioni",               emoji: "😮" },
    { id: "espressioni_auguri",    name: "Auguri",                 emoji: "🎉" },
    { id: "espressioni_meteo",     name: "Parlare del tempo",      emoji: "🌦️" },
    { id: "espressioni_opinione",  name: "Esprimere opinioni",     emoji: "💭" },
    { id: "professioni",           name: "Professioni",            emoji: "👷" },
    { id: "lavoro",                name: "Lavoro e ufficio",       emoji: "💼" },
    { id: "scuola",                name: "Scuola e studio",        emoji: "📚" },
    { id: "materie",               name: "Materie scolastiche",    emoji: "🔬" },
    { id: "sport",                 name: "Sport",                  emoji: "⚽" },
    { id: "sport_2",               name: "Sport e hobby",          emoji: "🏋️" },
    { id: "strumenti",             name: "Strumenti musicali",     emoji: "🎸" },
    { id: "hobby",                 name: "Tempo libero",           emoji: "🎨" },
    { id: "materiali",             name: "Materiali",              emoji: "🪵" },
    { id: "tecnologia",            name: "Tecnologia",             emoji: "💻" },
    { id: "tecnologia_2",          name: "Tecnologia avanzata",    emoji: "🤖" },
    { id: "media",                 name: "Media e notizie",        emoji: "📰" },
    { id: "feste",                 name: "Feste e ricorrenze",     emoji: "🎊" },
    { id: "emozioni_base",         name: "Emozioni",               emoji: "😊" },
    { id: "emozioni_2",            name: "Emozioni complesse",     emoji: "😔" },
    { id: "concetti",              name: "Concetti astratti",      emoji: "🧩" },
    { id: "societa",               name: "Società e politica",     emoji: "🗳️" },
    { id: "ambiente",              name: "Ambiente e scienza",     emoji: "🌍" },
    { id: "geografia",             name: "Geografia",              emoji: "🗺️" },
    { id: "viaggi",                name: "Viaggi",                 emoji: "🧳" },
    { id: "casa_affitto",          name: "Casa e affitto",         emoji: "🔑" },
    { id: "pronomi_congiunzioni",  name: "Pronomi e congiunzioni", emoji: "🔗" },
    { id: "situazioni_lavoro",     name: "Situazioni: lavoro",     emoji: "📅" },
    { id: "situazioni_corpo",      name: "Situazioni: corpo",      emoji: "🤒" },
    { id: "situazioni_trasporti",  name: "Situazioni: trasporti",  emoji: "🚉" },
    { id: "situazioni_tecnologia", name: "Situazioni: tecnologia", emoji: "📱" },
    { id: "situazioni_sociali",    name: "Situazioni: sociali",    emoji: "🎉" },
    { id: "situazioni_emergenza",  name: "Situazioni: emergenza",  emoji: "🚨" },
    { id: "situazioni_emozioni",   name: "Situazioni: emozioni",   emoji: "🥺" },
    { id: "situazioni_servizio",   name: "Situazioni: servizio",   emoji: "📦" },
    { id: "situazioni_quotidiane", name: "Situazioni: quotidiane", emoji: "🌅" },
    { id: "tempo_espressioni",     name: "Espressioni di tempo",   emoji: "⏳" },
    { id: "banca",                 name: "Banca e denaro",         emoji: "🏦" },
    { id: "scuola_situazioni",     name: "Situazioni: scuola",     emoji: "📚" },
    { id: "phrasal_verbs",         name: "Phrasal verbs",          emoji: "🔗" },
    { id: "idioms",                name: "Modi di dire",           emoji: "🍀" },
  ];

  // ---------------------------------------------------------------------
  // 3. MAPPA front italiano → [livello default, [front...]]
  // ---------------------------------------------------------------------
  const CARD_META = {
    famiglia:              ["A1", ["madre","padre","figlio","figlia","fratello","sorella","nonno","nonna","marito","moglie","bambino","famiglia","amico","cugino","zio","zia","nipote","suocero","suocera","cognato","cognata","fidanzato","fidanzata","single","divorziato","vedovo","relazione","appuntamento","litigio","pettegolezzo"]],
    animali:               ["A1", ["cane","gatto","cavallo","mucca","maiale","pecora","gallina","uccello","pesce","topo","coniglio","leone","tigre","elefante","orso","scimmia","serpente","farfalla","ape","formica","ragno","delfino","balena","squalo","granchio","gambero","polpo","aquila","gufo","pinguino","canguro","zebra","giraffa","lupo","volpe","cervo","riccio","lumaca","rana"]],
    cibo:                  ["A1", ["pane","latte","formaggio","uovo","carne","pollo","riso","pasta","verdura","frutta","mela","banana","arancia","limone","fragola","uva","pomodoro","patata","cipolla","aglio","zucchero","sale","acqua","vino","birra","caffè","tè","torta","cioccolato","gelato","colazione","pranzo","cena","merenda","aperitivo","pepe","basilico","olio","aceto","senape","ketchup","pizza","hamburger","sushi","taco","curry","kebab"]],
    cucina_oggetti:        ["A2", ["coltello","forchetta","cucchiaio","piatto","bicchiere","pentola","padella","forno"]],
    corpo:                 ["A1", ["testa","occhio","naso","bocca","orecchio","mano","braccio","gamba","piede","cuore","capelli","dente","spalla","dito","unghia","pelle","schiena","ginocchio","collo","viso","fronte","guancia","mento","sopracciglio","polso","gomito"]],
    corpo_organi:          ["B1", ["cervello","polmone","stomaco","fegato","rene","muscolo","osso","sangue"]],
    salute:                ["A2", ["medicina","febbre","dolore","salute","malato","sano","farmacista","ricetta medica","pronto soccorso","ambulanza","iniezione","cerotto","termometro","mal di testa","mal di schiena","raffreddore","tosse","nausea"]],
    colori:                ["A1", ["rosso","blu","verde","giallo","nero","bianco","arancione","viola","rosa"]],
    numeri_base:           ["A1", ["uno","due","tre","quattro","cinque","sei","sette","otto","nove","dieci"]],
    numeri_grandi:         ["A1", ["undici","dodici","tredici","quattordici","quindici","sedici","diciassette","diciotto","diciannove","venti","trenta","quaranta","cinquanta","cento","mille","milione"]],
    forme:                 ["A2", ["cerchio","quadrato","triangolo","rettangolo"]],
    natura:                ["A1", ["sole","luna","stella","cielo","mare","montagna","fiume","albero","fiore","foglia","pioggia","neve","vento","fuoco","terra","aria","ghiaccio","sabbia","roccia"]],
    natura_2:              ["A2", ["nuvola","nebbia","tempesta","arcobaleno","temperatura","erba","cespuglio","radice","ramo","seme","isola","deserto","foresta","vulcano","lago","valle","pianura","collina","penisola","arcipelago","ghiacciaio","altopiano","terremoto","alluvione","siccità","uragano","valanga"]],
    meteo:                 ["A2", ["umidità","gelo","tuono","lampo"]],
    stagioni:              ["A1", ["primavera","estate","autunno","inverno"]],
    casa:                  ["A2", ["casa","porta","finestra","letto","sedia","tavolo","cucina","bagno","chiave","specchio","armadio","scaffale","tenda","tappeto","lampada","divano","balcone","giardino","tetto","muro","pavimento","soffitto","scala","cantina","garage","ingresso","corridoio","camera da letto","soggiorno","ripostiglio","orologio"]],
    elettrodomestici:      ["B1", ["lavatrice","lavastoviglie","frigorifero","congelatore","aspirapolvere","ferro da stiro","asciugacapelli","microonde"]],
    vestiario:             ["A2", ["scarpa","camicia","pantaloni","cappello","cappotto","occhiali","maglione","gonna","calzini","guanti","sciarpa","cintura","borsa","ombrello"]],
    citta:                 ["A2", ["strada","città","scuola","ospedale","negozio","chiesa","museo","parco","mercato","farmacia","banca","aeroporto","stazione","ristorante","albergo","municipio","cimitero","ponte","piazza","monumento","statua","semaforo","marciapiede","incrocio","fontana","supermercato","cassa","sconto","offerta","carrello","scontrino","contanti"]],
    trasporti:             ["A2", ["treno","macchina","aereo","nave","bicicletta","autobus","barca","motocicletta","metropolitana","taxi","camion","furgone","elicottero","sottomarino"]],
    direzioni:             ["A2", ["a destra","a sinistra","dritto","dietro","davanti","accanto","all'angolo"]],
    tempo_data:            ["A1", ["giorno","notte","settimana","mese","anno","oggi","domani","ieri","ora","minuto"]],
    giorni:                ["A1", ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"]],
    mesi:                  ["A1", ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"]],
    verbi_base:            ["A1", ["mangiare","bere","dormire","camminare","correre","parlare","ascoltare","leggere","scrivere","giocare","lavorare","studiare","amare","aiutare","comprare","vendere","aprire","chiudere","cercare","trovare","vedere","capire","sapere","pensare","volere","potere","dovere","venire","andare","partire","arrivare","portare","dare","prendere","mettere","fare","chiedere","guadagnare"]],
    verbi_azione:          ["A2", ["cantare","ballare","ridere","piangere","saltare","nuotare","volare","guidare","costruire","rompere","riparare","pulire","cucinare","pagare","spendere","risparmiare","ricordare","dimenticare","spiegare","imparare","insegnare"]],
    verbi_cambio:          ["B1", ["crescere","cambiare","continuare","iniziare","finire","perdere","vincere","indossare","svegliarsi","mostrare","nascondere","toccare","tirare","spingere","piegare","lanciare","cadere","salire","scendere","entrare","uscire","tornare","restare"]],
    verbi_decisione:       ["B1", ["decidere","scegliere","provare","riuscire","fallire","controllare","confermare","annullare","salvare","cancellare","stampare","disegnare","suonare","ringraziare"]],
    verbi_sociali:         ["B1", ["rispondere","discutere","litigare","scusarsi","promettere","consigliare","suggerire"]],
    verbi_riflessivi:      ["B1", ["preoccuparsi","arrabbiarsi","divertirsi","annoiarsi","innamorarsi","abituarsi","lamentarsi","migliorare","peggiorare","risolvere","evitare","permettere","vietare","obbligare"]],
    aggettivi_base:        ["A1", ["grande","piccolo","lungo","corto","alto","basso","nuovo","vecchio","bello","brutto","buono","cattivo","facile","difficile","caldo","freddo","felice","triste","stanco","forte","debole","ricco","povero","pulito","sporco","veloce","lento","pesante","leggero","bellissimo","vicino","lontano"]],
    aggettivi_personalita: ["A2", ["giovane","simpatico","intelligente","stupido","curioso","timido","coraggioso","pigro","onesto","gentile","educato","maleducato","interessante","noioso","importante","utile","inutile","libero","occupato","pieno","vuoto","ambizioso","generoso","egoista","paziente","impaziente","ottimista","pessimista","testardo","flessibile"]],
    aggettivi_sapori:      ["A2", ["dolce","amaro","acido","salato","secco","bagnato","liscio","ruvido","morbido","duro","ampio","stretto","profondo","sottile"]],
    aggettivi_valutativi:  ["B1", ["fantastico","terribile","eccellente","mediocre","sorprendente","incredibile","straordinario","normale"]],
    avverbi:               ["A1", ["sempre","mai","spesso","adesso","dopo","prima","lontano","dentro","fuori","sopra","sotto","improvvisamente"]],
    espressioni_saluti:    ["A1", ["Buongiorno","Buonasera","Buonanotte","Ciao","Arrivederci","A presto","A domani","Come stai?","Sto bene, grazie","Piacere di conoscerti"]],
    espressioni_cortesia:  ["A1", ["Per favore","Grazie mille","Prego","Mi scusi","Mi dispiace","Non c'è di che"]],
    espressioni_quotidiane:["A1", ["Che ore sono?","Dove si trova?","Quanto costa?","Come ti chiami?","Di dove sei?","Puoi ripetere?","Non capisco","Non lo so","Parli italiano?","Parli inglese?"]],
    espressioni_ristorante:["A2", ["Il conto, per favore","Buon appetito","Vorrei un caffè","Posso avere il menù?","Sono vegetariano","Basta così, grazie"]],
    espressioni_viaggio:   ["A2", ["Dov'è il bagno?","Quanto tempo ci vuole?","Ho bisogno di aiuto","Mi sono perso","A che ora parte il treno?"]],
    espressioni_telefono:  ["A2", ["Pronto?","Un attimo, per favore","Richiamo più tardi"]],
    espressioni_reazioni:  ["A2", ["Che bello!","Non importa","Va bene","D'accordo","Certo","Forse","Peccato!"]],
    espressioni_auguri:    ["A2", ["Auguri!","Buon compleanno!","Buona fortuna!","In bocca al lupo!","Buon viaggio!","Salute!"]],
    espressioni_meteo:     ["A2", ["Che tempo fa?","Fa caldo oggi","Sta piovendo"]],
    espressioni_opinione:  ["B1", ["Secondo me","Sono d'accordo","Non sono d'accordo","A mio parere","Per esempio","Cioè","Inoltre","Tuttavia","Infine","D'altra parte","In ogni caso","Comunque","Anzi","Purtroppo","Per fortuna"]],
    professioni:           ["A2", ["medico","insegnante","avvocato","cuoco","poliziotto","infermiere","studente","contadino","ingegnere","artista","musicista","scrittore","giornalista","pilota","architetto","attore","attrice","regista","ballerino","fotografo","designer"]],
    lavoro:                ["B1", ["ufficio","riunione","collega","capo","stipendio","intervista","curriculum","scadenza","progetto","sito web","email","allegato","download","wifi","contratto","documento","modulo","firma","ufficio postale","ambasciata","disoccupazione","pensione","tassa","dipendente","datore di lavoro","dimissioni","promozione"]],
    scuola:                ["A2", ["matita","quaderno","zaino","lavagna","aula","esame","voto","compito","biblioteca","graffetta","evidenziatore","calcolatrice","agenda","libro","penna"]],
    materie:               ["A2", ["fisica","chimica","biologia","matematica","storia","musica"]],
    sport:                 ["A2", ["calcio","tennis","nuoto","pallacanestro","corsa","ciclismo","palestra","squadra"]],
    sport_2:               ["B1", ["pallavolo","golf","sci","pattinaggio","arrampicata","yoga"]],
    strumenti:             ["A2", ["chitarra","pianoforte","violino","tamburo","tromba","flauto"]],
    hobby:                 ["A2", ["pittura","fotografia","giardinaggio","disegno","lettura","cucito","cinema","teatro","concerto","mostra","videogioco","scacchi","carte da gioco","puzzle","scultura","poesia","romanzo","canzone","ballo"]],
    materiali:             ["A2", ["legno","ferro","plastica","vetro","carta","pietra","oro","argento"]],
    tecnologia:            ["A2", ["televisione","radio","internet","tastiera","schermo","batteria","computer","telefono","applicazione","password","file","cavo","stampante","altoparlante","microfono","aggiornamento","dispositivo","connessione","dati"]],
    tecnologia_2:          ["B1", ["smartphone","tablet","laptop","drone","satellite","robot","social media"]],
    media:                 ["B1", ["giornale","rivista","notizia","pubblicità","canale","programma"]],
    feste:                 ["A2", ["matrimonio","festa","regalo","invito","candela","fuochi d'artificio"]],
    emozioni_base:         ["A1", ["amore","paura","rabbia","sorpresa","speranza","noia"]],
    emozioni_2:            ["B1", ["gelosia","orgoglio","vergogna","fiducia","gratitudine","delusione","entusiasmo","imbarazzo","calma"]],
    concetti:              ["B1", ["opinione","problema","soluzione","situazione","esperienza","obiettivo","decisione","opportunità","sfida","cambiamento","coraggio"]],
    societa:               ["B2", ["attualità","dibattito","sondaggio","manifestazione","sciopero","elezioni","governo","presidente","ministro"]],
    ambiente:              ["B2", ["clima","cambiamento climatico","sostenibilità","emissioni","natura","inquinamento","riciclaggio","energia","pianeta","universo","galassia","cometa","eclissi"]],
    geografia:             ["A2", ["continente","paese","confine","capitale"]],
    viaggi:                ["A2", ["valigia","passaporto","biglietto","mappa","vacanza","bagaglio","viaggiare"]],
    casa_affitto:          ["B1", ["affitto","proprietario","inquilino","condominio","bolletta","trasloco"]],
    pronomi_congiunzioni:  ["A1", ["chi","che cosa","quale","perché","come","quando","dove","quanto","e","ma","o","però","quindi","anche","invece","mentre"]],
    situazioni_lavoro:     ["A2", ["Posso fare una domanda?","Ho una riunione","Sono in pausa pranzo","A che ora inizi a lavorare?","Devo finire questo entro oggi","Puoi aiutarmi?"]],
    situazioni_corpo:      ["A2", ["Ho fame","Ho sete","Ho sonno","Sono stanco","Fa freddo qui","Accendi la luce","Spegni la TV","Chiudi la porta","Apri la finestra","Non mi sento bene","Ho la febbre","Devo prendere un appuntamento","Quali sono i sintomi?"]],
    situazioni_trasporti:  ["A2", ["Questo posto è libero?","Dove devo scendere?","A che ora parte il prossimo treno?","Mi scusi, dov'è la fermata?"]],
    situazioni_tecnologia: ["A2", ["Il telefono è scarico","Non ho campo","Puoi mandarmi un messaggio?","Hai il caricabatterie?","La connessione non funziona"]],
    situazioni_sociali:    ["A2", ["Che lavoro fai?","Ti va di uscire?","Ci vediamo dopo","Facciamo qualcosa insieme","Sei libero stasera?","Posso entrare?","Posso usare il bagno?","Mi puoi prestare una penna?","Le dispiace se apro la finestra?","Potrebbe ripetere più lentamente?"]],
    situazioni_emergenza:  ["A2", ["Chiamate un'ambulanza!","C'è stato un incidente","Ho bisogno di un medico","Fate attenzione!","È un'emergenza"]],
    situazioni_emozioni:   ["B1", ["Non ci posso credere!","Sono così felice!","Mi manchi","Ti voglio bene","Congratulazioni!","Che sollievo!"]],
    situazioni_servizio:   ["B1", ["Questo non funziona","Vorrei un rimborso","Chi è responsabile?","Ho un problema con l'ordine","Posso parlare con il responsabile?","Non sono soddisfatto","Voglio fare un reclamo"]],
    situazioni_quotidiane: ["B1", ["Com'è andata la giornata?","Cosa hai fatto nel weekend?","Che tempo ha fatto ieri?","Hai visto le notizie?","Ci sono novità?","Tutto bene?","Niente di nuovo"]],
    tempo_espressioni:     ["B1", ["Di recente","Tra poco","Appena","Ormai","Prima o poi","Da un po' di tempo","Fino ad ora"]],
    banca:                 ["A2", ["Vorrei aprire un conto","Qual è il saldo?","Posso pagare con la carta?","Accettate contanti?","Dov'è il bancomat più vicino?","bancomat","portafoglio"]],
    scuola_situazioni:     ["B1", ["Quando sono le vacanze?","A che punto sei con il progetto?","Hai capito la lezione?","Posso avere una proroga?"]],
    phrasal_verbs:         ["B1", ["alzarsi","svegliarsi","vestirsi","trovare (per caso)","scoprire","arrendersi","occuparsi di","non vedere l'ora di","mettere via","risolvere (un problema)"]],
    idioms:                ["B2", ["In bocca al lupo!","Costa un occhio della testa","È facile come bere un bicchier d'acqua","Piove a catinelle","Non è la mia tazza di tè","Una volta ogni morte di papa","Rompere il ghiaccio","Sotto il naso"]],
  };

  // ---------------------------------------------------------------------
  // 4. OVERRIDE INDIVIDUALI (livello diverso dal default del tema)
  // ---------------------------------------------------------------------
  const LEVEL_OVERRIDES = {
    // famiglia (default A1)
    "cugino": "A2", "zio": "A2", "zia": "A2", "nipote": "A2",
    "suocero": "B1", "suocera": "B1", "cognato": "B1", "cognata": "B1",
    "single": "B1", "divorziato": "B1", "vedovo": "B1",
    "relazione": "B1", "appuntamento": "B1", "litigio": "B1", "pettegolezzo": "B1",

    // lavoro (default B1)
    "ufficio": "A2", "stipendio": "A2", "contratto": "A2", "documento": "A2",
    "modulo": "A2", "firma": "A2",
    "disoccupazione": "B2", "pensione": "B2", "dimissioni": "B2", "promozione": "B2",
    "ambasciata": "B2", "tassa": "B2",

    // aggettivi_personalita (default A2)
    "ambizioso": "B1", "generoso": "B1", "egoista": "B1",
    "paziente": "B1", "impaziente": "B1", "ottimista": "B1",
    "pessimista": "B1", "testardo": "B1", "flessibile": "B1",

    // salute (default A2)
    "farmacista": "B1", "ricetta medica": "B1", "pronto soccorso": "B1",
    "ambulanza": "B1", "iniezione": "B1", "termometro": "B1",
    "mal di testa": "B1", "mal di schiena": "B1", "nausea": "B1",

    // tecnologia (default A2) / tecnologia_2 (B1)
    "applicazione": "B1", "password": "B1", "file": "B1",
    "cavo": "B1", "stampante": "B1", "altoparlante": "B1", "microfono": "B1",
    "aggiornamento": "B1", "dispositivo": "B1", "connessione": "B1",
    "dati": "B2",
    "social media": "B1",

    // media (B1 default, ok)
    // feste (A2 default, ok)

    // societa (B2 default, ok)
    // ambiente (B2 default, ok)
    "clima": "B1", "cambiamento climatico": "B1", "inquinamento": "B1",
    "riciclaggio": "B1", "energia": "B1", "pianeta": "B1",

    // concetti (B1 default)
    "problema": "A2",

    // cibo (A1 default)
    "taco": "B1", "curry": "B1", "kebab": "B1",
    "merenda": "A2", "aperitivo": "B1",

    // cucina_oggetti (A2 default, ok)
    // casa (A2 default, ok)
    // elettrodomestici (B1 default, ok)

    // hobby (A2 default)
    "scultura": "B1", "poesia": "B1", "romanzo": "B1",

    // scuola (A2 default)
    "biblioteca": "B1", "evidenziatore": "B1",

    // avverbi (A1 default)
    "improvvisamente": "B1",

    // concetti extra
    "coraggio": "B1",

    // frase "a che ora parte..." (viaggio, A2 default, ok)
  };

  // ---------------------------------------------------------------------
  // 5. NUOVE CARTE INGLESI (10 phrasal verbs + 8 idioms)
  // ---------------------------------------------------------------------
  const NEW_EN_CARDS = [
    // Phrasal verbs
    { front: "alzarsi",                  back: "get up",            phon: "/ɡɛt ʌp/",              emoji: "⏰" },
    { front: "svegliarsi",               back: "wake up",           phon: "/weɪk ʌp/",             emoji: "😴" },
    { front: "vestirsi",                 back: "get dressed",       phon: "/ɡɛt drɛst/",           emoji: "👕" },
    { front: "trovare (per caso)",       back: "come across",       phon: "/kʌm əˈkrɒs/",          emoji: "🔍" },
    { front: "scoprire",                 back: "find out",          phon: "/faɪnd aʊt/",           emoji: "💡" },
    { front: "arrendersi",               back: "give up",           phon: "/ɡɪv ʌp/",              emoji: "🏳️" },
    { front: "occuparsi di",             back: "look after",        phon: "/lʊk ˈɑːftə/",          emoji: "👶" },
    { front: "non vedere l'ora di",      back: "look forward to",   phon: "/lʊk ˈfɔːwəd tuː/",     emoji: "🤩" },
    { front: "mettere via",              back: "put away",          phon: "/pʊt əˈweɪ/",           emoji: "📦" },
    { front: "risolvere (un problema)",  back: "sort out",          phon: "/sɔːt aʊt/",            emoji: "🔧" },

    // Idioms
    { front: "In bocca al lupo!",                        back: "Break a leg!",                         phon: "/breɪk ə lɛɡ/",                      emoji: "🍀" },
    { front: "Costa un occhio della testa",              back: "It costs an arm and a leg",            phon: "/kɒsts ən ɑːm ənd ə lɛɡ/",           emoji: "💸" },
    { front: "È facile come bere un bicchier d'acqua",   back: "It's a piece of cake",                 phon: "/piːs əv keɪk/",                     emoji: "🍰" },
    { front: "Piove a catinelle",                        back: "It's raining cats and dogs",           phon: "/ˈreɪnɪŋ kæts ənd dɒɡz/",            emoji: "🌧️" },
    { front: "Non è la mia tazza di tè",                 back: "It's not my cup of tea",               phon: "/nɒt maɪ kʌp əv tiː/",               emoji: "🍵" },
    { front: "Una volta ogni morte di papa",             back: "Once in a blue moon",                  phon: "/wʌns ɪn ə bluː muːn/",              emoji: "🌙" },
    { front: "Rompere il ghiaccio",                      back: "Break the ice",                        phon: "/breɪk ði aɪs/",                     emoji: "🧊" },
    { front: "Sotto il naso",                            back: "Under someone's nose",                 phon: "/ˈʌndə ˈsʌmwʌnz nəʊz/",              emoji: "👃" },
  ];

  // ---------------------------------------------------------------------
  // 6. COSTRUZIONE MAPPA INVERSA  front → { theme, level }
  // ---------------------------------------------------------------------
  const FRONT_META = (() => {
    const map = Object.create(null);
    for (const [theme, [defaultLevel, fronts]] of Object.entries(CARD_META)) {
      for (const front of fronts) {
        if (map[front]) {
          console.warn(`[meta.js] front duplicato: "${front}" (temi: ${map[front].theme} + ${theme})`);
        }
        map[front] = { theme, level: LEVEL_OVERRIDES[front] || defaultLevel };
      }
    }
    return map;
  })();

  // ---------------------------------------------------------------------
  // 7. AGGIUNTA NUOVE CARTE AL MAZZO "en" (idempotente)
  // ---------------------------------------------------------------------
  const enDeck = DECKS.find((d) => d.id === "en");
  if (enDeck) {
    const existing = new Set(enDeck.cards.map((c) => c.front));
    let added = 0;
    for (const card of NEW_EN_CARDS) {
      if (!existing.has(card.front)) {
        enDeck.cards.push(card);
        existing.add(card.front);
        added++;
      }
    }
    if (added) console.log(`[meta.js] Aggiunte ${added} nuove carte al mazzo Inglese.`);
  } else {
    console.warn("[meta.js] Mazzo 'en' non trovato.");
  }

  // ---------------------------------------------------------------------
  // 8. ARRICCHIMENTO DI TUTTE LE CARTE (tutti i mazzi)
  // ---------------------------------------------------------------------
  let mappedCount = 0, unmappedCount = 0;
  for (const deck of DECKS) {
    for (const card of deck.cards) {
      const meta = FRONT_META[card.front];
      if (meta) {
        card.theme = meta.theme;
        card.level = meta.level;
        mappedCount++;
      } else {
        card.theme = card.theme || "altro";
        card.level = card.level || "A1";
        unmappedCount++;
      }
    }
  }
  console.log(`[meta.js] Carte mappate: ${mappedCount} — non mappate: ${unmappedCount}`);

  // ---------------------------------------------------------------------
  // 9. FUNZIONI PUBBLICHE
  // ---------------------------------------------------------------------
  function filterCards(cards, { theme, level, search } = {}) {
    return cards.filter((c) => {
      if (theme && c.theme !== theme) return false;
      if (level && c.level !== level) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.front} ${c.back}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function getThemesForCards(cards) {
    const ids = new Set(cards.map((c) => c.theme).filter(Boolean));
    return THEMES.filter((t) => ids.has(t.id));
  }

  function getLevelsForCards(cards) {
    const ids = new Set(cards.map((c) => c.level).filter(Boolean));
    return LEVELS.filter((l) => ids.has(l.id));
  }

  function getUnmappedCards() {
    const out = [];
    for (const deck of DECKS) {
      for (const card of deck.cards) {
        if (card.theme === "altro") {
          out.push({ deck: deck.id, front: card.front, back: card.back });
        }
      }
    }
    return out;
  }

  function getCardMeta(front) {
    return FRONT_META[front] || null;
  }

  function buildThemeDecks(baseId) {
    const base = DECKS.find((d) => d.id === baseId);
    if (!base) return [];
    return THEMES.map((t) => {
      const cards = base.cards.filter((c) => c.theme === t.id);
      if (!cards.length) return null;
      return { id: `${baseId}-${t.id}`, name: `${base.name} – ${t.name}`, flag: base.flag, lang: base.lang, cards };
    }).filter(Boolean);
  }

  function buildLevelDecks(baseId) {
    const base = DECKS.find((d) => d.id === baseId);
    if (!base) return [];
    return LEVELS.map((l) => {
      const cards = base.cards.filter((c) => c.level === l.id);
      if (!cards.length) return null;
      return { id: `${baseId}-${l.id}`, name: `${base.name} – ${l.name}`, flag: base.flag, lang: base.lang, cards };
    }).filter(Boolean);
  }

  // ---------------------------------------------------------------------
  // 10. ESPOSIZIONE GLOBALE
  // ---------------------------------------------------------------------
  window.LEVELS = LEVELS;
  window.THEMES = THEMES;
  window.filterCards = filterCards;
  window.getThemesForCards = getThemesForCards;
  window.getLevelsForCards = getLevelsForCards;
  window.getUnmappedCards = getUnmappedCards;
  window.getCardMeta = getCardMeta;
  window.buildThemeDecks = buildThemeDecks;
  window.buildLevelDecks = buildLevelDecks;
  window.Meta = {
    LEVELS, THEMES, CARD_META, LEVEL_OVERRIDES, FRONT_META,
    filterCards, getThemesForCards, getLevelsForCards,
    getUnmappedCards, getCardMeta, buildThemeDecks, buildLevelDecks,
  };
})();
