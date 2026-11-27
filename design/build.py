import sys, os, re
D = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(D, n), encoding='utf-8').read()

LOGO_SVG = ('<svg class="wb-logo" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">'
  '<path d="M3 7l9 5 9-5v10l-9 5-9-5zM12 12v10"/>'
  '<g class="wb-lid"><path d="M12 2l9 5-9 5-9-5z"/></g>'
  '<path class="wb-spark" d="M4.4 0l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7L2 2.4l1.7-.7z"/></svg>')

SPLASH = ('<div id="wb-splash" aria-hidden="true"><div class="sp-art"><span class="sp-burst"></span>'
  '<svg viewBox="0 0 24 24" width="112" height="112">'
  '<path class="sp-glow" d="M3 7l9 5 9-5-9-5z"/>'
  '<path class="sp-body" pathLength="1" d="M3 7l9 5 9-5v10l-9 5-9-5zM12 12v10"/>'
  '<g class="sp-lid"><path d="M12 2l9 5-9 5-9-5z"/></g>'
  '<path class="sp-spark" d="M4.4 0l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7L2 2.4l1.7-.7z"/></svg></div>'
  '<div class="sp-word">White Box</div></div>'
  '<script>(function(){var s=document.getElementById("wb-splash");if(!s)return;var done=false;'
  'function end(){if(done)return;done=true;s.remove()}'
  'function skip(){if(done)return;s.classList.add("skip");setTimeout(end,260)}'
  's.addEventListener("animationend",function(e){if(e.target===s)end()});'
  's.addEventListener("click",skip);document.addEventListener("keydown",skip,{once:true});'
  'setTimeout(end,3200)})()</script>')

OLD_MARK = '<span class="logo-mark" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7"/></svg></span>'
NEW_MARK = '<span class="logo-mark${LOGO_N++?\'\':\' play\'}" aria-hidden="true">${LOGO_SVG}</span>'

def favicon(bg, line, face, face2, glow):
    s = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='{bg}'/>"
         f"<g fill='none' stroke='{line}' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round' transform='translate(2.4 3) scale(.8)'>"
         f"<path d='M3 7l9 5 9-5v10l-9 5-9-5zM12 12v10'/><path d='M12 2l9 5-9 5-9-5z' fill='{bg}' transform='translate(0 -1) rotate(-11 3 7)'/></g>"
         f"<circle cx='6' cy='4.6' r='1.4' fill='{glow}'/></svg>")
    return '<link rel="icon" href="data:image/svg+xml,' + s.replace('#', '%23').replace('<', '%3C').replace('>', '%3E') + '">'

def base():
    h = open(os.environ.get('WB_BASE', os.path.join(D, 'index.orig.html')), encoding='utf-8').read()
    old_font = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Playfair+Display:wght@700;900&display=swap'
    assert h.count(old_font) == 1 and h.count(OLD_MARK) == 1 and h.count('function shell(inner)') == 1
    h = h.replace(OLD_MARK, NEW_MARK)
    h = h.replace('function shell(inner)', 'let LOGO_N=0;const LOGO_SVG=`' + LOGO_SVG + '`;\nfunction shell(inner)')
    # brand blue baked into SVG attributes -> follow the theme
    h = h.replace('stroke="#3355E0"', 'style="stroke:var(--blue)"').replace('fill="#3355E0"', 'style="fill:var(--blue)"')
    return h, old_font

def build(out, font_url, theme_css, fav, font_swap=None, hook=None):
    h, old_font = base()
    if hook: h = hook(h)
    h = h.replace(old_font, font_url)
    if font_swap:
        h = h.replace("--display:'Bricolage Grotesque','Inter',sans-serif;", "--display:" + font_swap[0] + ";")
        h = h.replace("'Lexend'", font_swap[1]).replace('Lexend,sans-serif', font_swap[2]).replace('Lexend, sans-serif', font_swap[2])
    h = h.replace('</title>', '</title>\n' + fav, 1)
    css = ''.join(rd(c) for c in (theme_css if isinstance(theme_css, (list, tuple)) else [theme_css]))
    h = h.replace('</head>', rd('logo.css') + css + '</head>')
    open(os.path.join(os.environ.get('WB_OUT', D), out), 'w', encoding='utf-8').write(h)
    print(out, len(h), 'Lexend left:', h.count('Lexend'))


NAV_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${n[2]}"/></svg>'
BACK_ICO = "const backIco='<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" aria-hidden=\"true\"><path d=\"M15 18l-6-6 6-6\"></path></svg>'"

# lessons: swap the old navy tints for Material 3 neutral dark tones (mono theme only)
NAVY = {'#161A26':'#1B1B1B','#151A27':'#1B1B1B','#1E2230':'#1B1B1B','#1E2333':'#262626','#1F2536':'#262626','#1C2131':'#232323',
 '#222842':'#2A2A2A','#232838':'#2A2A2A','#232A3D':'#2A2A2A','#262C3D':'#303030','#262D41':'#303030','#2A3042':'#3A3A3A',
 '#2E3650':'#5A5A5A','#323A52':'#6E6E6E','#3B4258':'#6E6E6E','#4A5372':'#6E6E6E','#5B6480':'#8A8A8A','#5D6580':'#8A8A8A',
 '#6B7390':'#9A9A9A','#7D86A3':'#A8A8A8','#8E97B3':'#B0B0B0','#9AA3BC':'#B8B8B8','#A4ACC4':'#C4C4C4','#B8C0D6':'#CACACA',
 '#C8CEDF':'#D6D6D6','#C9D0E3':'#D6D6D6','#C9D2E8':'#D6D6D6','#C8D3FF':'#E0E0E0','#E8ECF7':'#EDEDED','#E8EBF4':'#EDEDED',
 '#5B6B95':'#9A9A9A','#6E8BFF':'#A8A8A8','#5B73F5':'#A8A8A8','#8EA4FF':'#FFC845'}
def neutral_dark(h):
    i = h.index('<script>')  # CSS + markup before the app script, and the script's inline styles
    for a, c in NAVY.items():
        h = h.replace(a, c).replace(a.lower(), c)
    return h


TOK_A = """<button class="tok fact ${isCur?'cur':''} ${v?(v===cl.answer?'ok':'bad'):''}" data-act="pickFact" data-arg="${i}" ${checking?'':'tabindex="-1"'}>${mark} ${esc(t2)}</button>"""
TOK_A2 = """<span role="button" class="tok fact ${isCur?'cur':''} ${v?(v===cl.answer?'ok':'bad'):''}" data-act="pickFact" data-arg="${i}" tabindex="${checking?0:-1}">${mark} ${esc(t2)}</span>"""
TOK_B = """<button class="tok ${cls}" data-act="flag" data-arg="${id}" ${V.flagDone?'tabindex="-1"':''} aria-pressed="${!!on}">${esc(t2)}</button>"""
TOK_B2 = """<span role="button" class="tok ${cls}" data-act="flag" data-arg="${id}" tabindex="${V.flagDone?-1:0}" aria-pressed="${!!on}">${esc(t2)}</span>"""
def inline_tokens(h):
    assert h.count(TOK_A) == 1 and h.count(TOK_B) == 1, (h.count(TOK_A), h.count(TOK_B))
    return h.replace(TOK_A, TOK_A2).replace(TOK_B, TOK_B2)


RENDER_OLD = "app.innerHTML=shell(inner)+(S.toast&&!S.modal?`<div class=\"toast\" role=\"status\">${esc(S.toast)}</div>`:'')+modalHTML();"
RENDER_NEW = "paint(shell(inner)+(S.toast&&!S.modal?`<div class=\"toast\" role=\"status\">${esc(S.toast)}</div>`:'')+modalHTML());"
PAINT = """/* update only what changed, so images, hover, focus, scroll and animations stay put */
function paint(html){
  if(!window.morphdom||!app.firstChild){app.innerHTML=html;return}
  const next=document.createElement('div');next.innerHTML=html;
  morphdom(app,next,{childrenOnly:true,
    onBeforeElUpdated(from,to){
      if(to.classList&&to.classList.contains('fade-in')&&!from.classList.contains('fade-in'))to.classList.remove('fade-in');
      if(from.isEqualNode(to))return false;
      if(from===document.activeElement&&(from.tagName==='INPUT'||from.tagName==='TEXTAREA'))to.value=from.value;
      if(from.tagName==='DETAILS')to.open=from.open;
      return true},
    onBeforeNodeDiscarded(node){return !(node.tagName==='CANVAS'&&node.parentNode&&node.parentNode.id==='mxstage')}})}
function render(){"""
def diff_render(h):
    assert h.count(RENDER_OLD) == 1 and h.count('function render(){') == 1, (h.count(RENDER_OLD), h.count('function render(){'))
    h = h.replace(RENDER_OLD, RENDER_NEW).replace('function render(){', PAINT, 1)
    tag = '<script src="https://cdn.jsdelivr.net/npm/morphdom@2.7.4/dist/morphdom-umd.min.js"></script>\n'
    guard = '<script>document.fonts&&document.fonts.load(\'24px "Material Symbols Rounded"\').then(function(f){if(f.length)document.documentElement.classList.add("msym-ok")});setTimeout(function(){if(document.fonts&&document.fonts.check(\'24px "Material Symbols Rounded"\'))document.documentElement.classList.add("msym-ok")},3500)</script>\n'
    return h.replace('<style>', tag + guard + '<style>', 1)


NOISE_OLD = "let op,col;if(t<0.4){col='201,210,232';op=0.1+n*0.55}else if(t<0.62){col=inS?'255,138,61':'201,210,232';op=inS?0.35+n*0.4:n*0.35}else{col=inS?'255,138,61':'201,210,232';op=inS?0.95:0.07}"
NOISE_NEW = "let op,col;if(t<0.4){col='236,236,236';op=0.3+n*0.6}else if(t<0.62){col=inS?'255,200,69':'236,236,236';op=inS?0.55+n*0.4:0.18+n*0.4}else{col=inS?'255,200,69':'236,236,236';op=inS?1:0.16}"
def noise_cover(h):
    assert h.count(NOISE_OLD) == 1
    return h.replace(NOISE_OLD, NOISE_NEW)

def m3_hook(h):
    h = material_symbols(h)
    h = noise_cover(h)
    h = diff_render(h)
    h = inline_tokens(h)
    h = neutral_dark(h)
    assert h.count('<div id="app"></div>') == 1
    return h.replace('<div id="app"></div>', SPLASH + '<div id="app"></div>')
def material_symbols(h):
    assert h.count(NAV_SVG)==1 and h.count(BACK_ICO)==1, (h.count(NAV_SVG),h.count(BACK_ICO))
    h = h.replace(NAV_SVG, '<span class="msym" aria-hidden="true">${MSYM[n[0]]}</span>')
    h = h.replace(BACK_ICO, "const backIco='<span class=\"msym sm\" aria-hidden=\"true\">arrow_back</span>'")
    i = h.index('<span class="gear ${S.screen'); j = h.index('</svg>', i) + 6
    h = h[:i] + '<span class="gear ${S.screen===\'settings\'?\'on\':\'\'}"><span class="msym" aria-hidden="true">settings</span>' + h[j:]
    h = h.replace('function shell(inner)', "const MSYM={home:'map',values:'favorite',lessons:'school',cases:'cases',guide:'menu_book',journey:'route'};\nfunction shell(inner)", 1)
    return h

ROBOTO = 'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700&family=Playfair+Display:wght@700;900&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0&display=block'
PLAYFAIR = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap'
which = sys.argv[1:] or ['m3', 'govuk', 'ads']
if 'm3' in which:
    build('index.html', ROBOTO, ['m3.css', 'mono.css'], favicon('#1B1B1B', '#FFFFFF', '#1B1B1B', '#1B1B1B', '#FFC845'),
          ("'Roboto Flex','Roboto',sans-serif", "'Roboto Flex'", 'Roboto Flex,sans-serif'), m3_hook)
if 'govuk' in which:
    build('govuk/index.html', PLAYFAIR, 'govuk.css', favicon('#0B0C0C', '#0B0C0C', '#FFFFFF', '#DDDDDD', '#FFDD00'),
          ('"Helvetica Neue",Helvetica,Arial,sans-serif', '"Helvetica Neue",Helvetica,Arial', 'Helvetica,Arial,sans-serif'))
if 'ads' in which:
    sysf = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,"Helvetica Neue",sans-serif'
    build('ads/index.html', PLAYFAIR, 'ads.css', favicon('#0C66E4', '#09326C', '#FFFFFF', '#CCE0FF', '#F5CD47'),
          (sysf, '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto', 'system-ui,sans-serif'))
