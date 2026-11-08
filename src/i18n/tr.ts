/**
 * Turkish dictionary.
 *
 * This file defines the SHAPE of every dictionary (see `Dictionary` in
 * ./types.ts). Every other language must provide exactly the same keys, and
 * TypeScript will fail the build if one is missing.
 *
 * - `ui`     : labels shown on screen or read by VoiceOver (accessibilityLabel).
 * - `speech` : sentences spoken aloud to the child (kids can't read yet, so
 *              spoken instructions are the main channel).
 *
 * Use {name} placeholders for values filled in at runtime.
 */
import type { CatalogId } from '@/data/catalog';

export const tr = {
  app: {
    title: 'Oyun Treni',
  },
  language: {
    /** Name of this language, written in this language. */
    name: 'Türkçe',
  },
  ui: {
    play: 'Oyna',
    album: 'Albüm',
    listenAgain: 'Tekrar dinle',
    continue: 'Devam',
    settings: 'Ayarlar',
    locked: 'Kilitli',
    forGrownUps: 'Büyükler için',
    back: 'Geri',
    map: 'Tren haritası',
    train: 'Tren',
    station: 'İstasyon {number}',
  },
  speech: {
    welcome: 'Merhaba! Hadi trene binelim!',
    languageChanged: 'Türkçe!',
    traceLetter: 'Parmağınla {letter} harfini çiz!',
    traceSmallLetter: 'Parmağınla küçük {letter} harfini çiz!',
    tryAgain: 'Hadi, bir daha deneyelim!',
    /** Said after a letter is traced, e.g. "K... Kedi!" */
    letterWord: '{letter}... {word}!',
    smallLetterWord: 'Küçük {letter}... {word}!',
    allAboard: '{name} trene bindi!',
    traceNumber: 'Parmağınla {number} rakamını çiz!',
    traceBigNumber: 'Parmağınla {number} sayısını çiz!',
    /** Said after a number is traced, e.g. "Üç!" */
    numberSaid: '{number}!',
    /** e.g. "Üç ayıcığı trene bindir!" ({toy} comes from `counting`). */
    putOnTrain: '{count} {toy} trene bindir!',
    countDone: '{count}! Harika, hepsi trende!',
    /** e.g. "Kırmızı arabayı bul!" ({vehicle} comes from `findObject`). */
    findColored: '{color} {vehicle} bul!',
    nameSaid: '{name}!',
    askGrownUp: 'Bu istasyon kilitli. Açmak için bir büyüğüne sor!',
    trainFull: 'Yaşasın! Tren doldu!',
    newSticker: 'Yeni bir çıkartma kazandın!',
    newStickers: '{count} yeni çıkartma kazandın!',
    noNewStickers: 'Hepsi zaten albümünde. Harikasın!',
    albumWelcome: 'Çıkartma albümün!',
  },
  /** Unlock screen and premium settings (parents read these, behind the gate). */
  premium: {
    title: 'Oyun Treni\'nin tamamı',
    subtitle: 'Tek seferlik ödeme. Abonelik yok, reklam yok.',
    featureLetters: 'Bütün alfabe, büyük ve küçük harfler',
    featureNumbers: '20\'ye kadar bütün sayılar, ayrıca 50, 100 ve 1000',
    featureQuizzes: 'Hayvan sesi ve taşıt soruları',
    featureFuture: 'İleride eklenecek bütün yeni istasyonlar',
    featureOneTime: 'Tek seferlik satın alma, abonelik yok',
    buy: 'Satın al',
    buyWithPrice: '{price} ile satın al',
    restore: 'Satın almayı geri yükle',
    buying: 'Satın alınıyor…',
    purchased: 'Teşekkürler! Bütün istasyonlar açıldı.',
    pending: 'Satın alma onay bekliyor (Satın Almak İçin Sor).',
    failed: 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.',
    restored: 'Satın alma geri yüklendi. Bütün istasyonlar açık.',
    nothingToRestore: 'Bu Apple kimliğinde geri yüklenecek bir satın alma bulunamadı.',
    owned: 'Oyunun tamamı açık. Teşekkürler!',
    section: 'Tam sürüm',
    testStore: 'Test modu (Expo Go): satın alma taklit edilir.',
    revokeTest: 'Test: tam sürümü kapat',
  },
  /** Parents area (behind the parent gate). Read by grown-ups, so plain text is fine. */
  parents: {
    gateTitle: 'Ebeveyn alanı',
    gateHint: 'Devam etmek için soruyu cevaplayın.',
    gateQuestion: '{a} + {b} = ?',
    title: 'Ayarlar',
    language: 'Dil',
    sound: 'Ses',
    music: 'Arka plan müziği',
    sfx: 'Ses efektleri',
    progress: 'İlerleme',
    reset: 'İlerlemeyi sıfırla',
    resetHint: 'Tüm tikler, çıkartmalar ve yolculuk treni silinir.',
    resetConfirmTitle: 'İlerleme sıfırlansın mı?',
    resetConfirmBody: 'Bu işlem geri alınamaz.',
    resetConfirm: 'Sıfırla',
    resetDone: 'İlerleme sıfırlandı.',
    cancel: 'Vazgeç',
    deleteDigit: 'Sil',
  },
  /** Album pages, by kind of sticker (see CatalogKind in src/data/catalog.ts). */
  albumTabs: {
    animal: 'Hayvanlar',
    toy: 'Oyuncaklar',
    vehicle: 'Taşıtlar',
    food: 'Yiyecekler',
  },
  /** Category cards on the menu after "Play" (see src/data/categories.ts). */
  categories: {
    letters: 'Harfler',
    numbers: 'Sayılar',
    animals: 'Hayvanlar',
    vehicles: 'Taşıtlar',
  },
  /** Color words for "find the red car" questions. */
  colorNames: {
    red: 'kırmızı',
    blue: 'mavi',
    yellow: 'sarı',
    green: 'yeşil',
  },
  /** How a vehicle is said as the object of "find ..." (Turkish accusative). */
  findObject: {
    car: 'arabayı',
  },
  /** Number words used for counting out loud. */
  numbers: {
    n1: 'Bir',
    n2: 'İki',
    n3: 'Üç',
    n4: 'Dört',
    n5: 'Beş',
    n6: 'Altı',
    n7: 'Yedi',
    n8: 'Sekiz',
    n9: 'Dokuz',
    n10: 'On',
    n11: 'On bir',
    n12: 'On iki',
    n13: 'On üç',
    n14: 'On dört',
    n15: 'On beş',
    n16: 'On altı',
    n17: 'On yedi',
    n18: 'On sekiz',
    n19: 'On dokuz',
    n20: 'Yirmi',
    n50: 'Elli',
    n100: 'Yüz',
    n1000: 'Bin',
  },
  /**
   * How a toy is said in "put N <toy> on the train", per count form.
   * Turkish keeps the noun singular after a number and uses the accusative
   * ("üç ayıcığı"), so both forms are the same here.
   */
  counting: {
    ball: { one: 'topu', other: 'topu' },
    drum: { one: 'davulu', other: 'davulu' },
    kite: { one: 'uçurtmayı', other: 'uçurtmayı' },
    robot: { one: 'robotu', other: 'robotu' },
    teddy: { one: 'ayıcığı', other: 'ayıcığı' },
  },
  /** Names of everything that can ride the train (see src/data/catalog.ts). */
  catalog: {
    ant: 'Karınca',
    bear: 'Ayı',
    bee: 'Arı',
    camel: 'Deve',
    cat: 'Kedi',
    chick: 'Civciv',
    chimpanzee: 'Şempanze',
    cow: 'İnek',
    deer: 'Geyik',
    dog: 'Köpek',
    dolphin: 'Yunus',
    donkey: 'Eşek',
    duck: 'Ördek',
    elephant: 'Fil',
    fish: 'Balık',
    frog: 'Kurbağa',
    giraffe: 'Zürafa',
    horse: 'At',
    iguana: 'İguana',
    jaguar: 'Jaguar',
    jellyfish: 'Denizanası',
    kangaroo: 'Kanguru',
    lion: 'Aslan',
    llama: 'Lama',
    lobster: 'Istakoz',
    monkey: 'Maymun',
    narwhal: 'Deniz gergedanı',
    octopus: 'Ahtapot',
    penguin: 'Penguen',
    rabbit: 'Tavşan',
    raccoon: 'Rakun',
    rooster: 'Horoz',
    sheep: 'Koyun',
    squirrel: 'Sincap',
    tiger: 'Kaplan',
    whale: 'Balina',
    zebra: 'Zebra',
    ball: 'Top',
    drum: 'Davul',
    kite: 'Uçurtma',
    queen: 'Kraliçe',
    robot: 'Robot',
    teddy: 'Ayıcık',
    unicorn: 'Tek boynuzlu at',
    xylophone: 'Ksilofon',
    yoyo: 'Yoyo',
    airplane: 'Uçak',
    bus: 'Otobüs',
    car: 'Araba',
    ferry: 'Vapur',
    fireTruck: 'İtfaiye aracı',
    van: 'Minibüs',
    grapes: 'Üzüm',
    pomegranate: 'Nar',
    strawberry: 'Çilek',
  } satisfies Record<CatalogId, string>,
};
