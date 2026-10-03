import Link from "next/link";
export default function Home() {
  return (
    <main className="home-page">
      <header className="home-nav">
        <Link className="brand-mark" href="/">
          حصة ✦
        </Link>
        <nav>
          <a href="#journey">كيف تتعلم</a>
          <a href="#features">تجربتك</a>
          <Link className="secondary-button" href="/login">
            دخول
          </Link>
        </nav>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">مساحة أهدأ. فهم أعمق.</p>
          <h1>
            تعلم على طريقتك.
            <br />
            <span>وتقدم بثقة.</span>
          </h1>
          <p>
            مواد منظمة، حصص مع مدرسك، وخطة تتطور مع إجاباتك. في حصة تعرف أين
            تبدأ، وما الخطوة التالية.
          </p>
          <div className="actions">
            <Link className="primary-button" href="/login">
              ابدأ رحلة التعلم ←
            </Link>
            <a className="text-button" href="#journey">
              اكتشف التجربة
            </a>
          </div>
          <div className="hero-tags">
            <span>خطة شخصية</span>
            <span>تعلم تفاعلي</span>
            <span>تقدم قابل للقياس</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="رحلة التعلم">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-symbol">ح</div>
          <div className="floating-card card-top">
            <span>✦</span>
            <div>
              <strong>فكرة جديدة</strong>
              <small>شرح ثم مثال ثم تدريب</small>
            </div>
          </div>
          <div className="floating-card card-bottom">
            <span>↗</span>
            <div>
              <strong>خطوة واضحة</strong>
              <small>تعلّم • جرّب • راجع</small>
            </div>
          </div>
        </div>
      </section>
      <section id="journey" className="home-section">
        <p className="eyebrow">رحلتك، خطوة بخطوة</p>
        <h2>لا تحتاج إلى معرفة كل شيء لتبدأ.</h2>
        <div className="feature-grid">
          {[
            [
              "01",
              "ابدأ من مستواك",
              "اختر موادك وابدأ بالتعلم والتقييم لتكوين صورة أوضح عن احتياجك.",
            ],
            [
              "02",
              "افهم ثم طبّق",
              "اقرأ الشرح، ناقش الفكرة، وحل الأسئلة بدل الاكتفاء بالمشاهدة.",
            ],
            [
              "03",
              "تابع ما تغيّر",
              "راجع إجاباتك وخطتك وتقدمك، واستثمر وقتك فيما يحتاج إلى تحسين.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="features" className="home-section dark-section">
        <p className="eyebrow">تجربة تعليم متصلة</p>
        <h2>كل ما تتعلمه يفتح الخطوة التالية.</h2>
        <div className="feature-grid">
          {[
            ["▤", "محتوى واضح", "دروس وأمثلة وأنشطة مرتبطة بموادك."],
            [
              "◉",
              "حصص وواجبات",
              "حجز مواعيد، تسليم إجابات وتغذية راجعة من المدرس.",
            ],
            [
              "◎",
              "خطة مبنية على الأدلة",
              "توصيات تعتمد على تقدمك وإجاباتك، مع بيان حدود التحليل.",
            ],
          ].map(([i, t, d]) => (
            <article key={t}>
              <span>{i}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="home-footer">
        <span className="brand-mark">حصة ✦</span>
        <p>خطوات صغيرة. معرفة تبقى.</p>
        <Link href="/login">دخول المنصة</Link>
      </footer>
    </main>
  );
}
