const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const readline = require('readline');

let isInterrupted = false;

process.on('SIGINT', () => {
    isInterrupted = true;
    console.log('\n[!] СИСТЕМНОЕ ПРЕРЫВАНИЕ (SIGINT). СОХРАНЕНИЕ ДАМПА...');
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

console.log('\n==================================================');
console.log(' [ STRESSER TERMINAL ] ЗАПУСК БОЕВОГО ЦИКЛА');
console.log('==================================================');

rl.question(' [?] IP/URL Цели (Target Host): ', (targetIp) => {
    rl.question(' [?] Время атаки (например, 30s, 1m): ', (executionTime) => {
        rl.question(' [?] Количество потоков (VUs, до 10000): ', (maxUsersInput) => {
            rl.close();

            targetIp = targetIp.trim() || '127.0.0.1';
            executionTime = executionTime.trim() || '30s';
            
            let parsedVUs = parseInt(maxUsersInput.trim(), 10);
            if (isNaN(parsedVUs) || parsedVUs < 1) {
                parsedVUs = 10;
            } else if (parsedVUs > 10000) {
                parsedVUs = 10000;
            }
            const maxUsers = parsedVUs.toString();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const jsonReportPath = path.join(logsDir, `raw_report_${timestamp}.json`);
            const htmlReportPath = path.join(logsDir, `test_report_${timestamp}.html`);

            console.log(`\n [>] Отправка пакетов... Цель: ${targetIp} | Потоки: ${maxUsers} | Время: ${executionTime}\n`);

            const command = `k6 run --out json="${jsonReportPath}" load-test.js`;
            
            const result = spawnSync(command, {
                stdio: 'inherit',
                shell: true,
                env: { ...process.env, TARGET_IP: targetIp, TEST_DURATION: executionTime, MAX_VUS: maxUsers }
            });

            let testStatus, statusColor, badgeText, statusDescriptionRu, targetStatusText;

            if (isInterrupted || result.signal === 'SIGINT') {
                testStatus = 'ПРЕРВАН';
                statusColor = '#f39c12';
                badgeText = 'ОТМЕНА // ПРЕРВАНО ПОЛЬЗОВАТЕЛЕМ';
                targetStatusText = '[ ВЕРДИКТ: АТАКА ПРЕРВАНА ОПЕРАТОРОМ ]';
                statusDescriptionRu = `> ПРОЦЕСС ОСТАНОВЛЕН.\n> Оператор инициировал остановку до завершения цикла (${executionTime}). Цель не получила полный объем нагрузки.`;
            } else if (result.status !== 0) {
                testStatus = 'ОШИБКА_ЦЕЛИ (УСПЕХ)';
                statusColor = '#ff003c';
                badgeText = 'КРИТИЧЕСКИЙ УРОН // ЦЕЛЬ УЯЗВИМА';
                targetStatusText = '[ ВЕРДИКТ: СЕРВЕР ЛЕГ / ПЕРЕГРУЖЕН ]';
                statusDescriptionRu = `> АТАКА ПРОШЛА УСПЕШНО.\n> Зафиксированы массовые отказы, таймауты или 5xx ошибки. Инфраструктура цели не выдержала наплыв в ${maxUsers} потоков. Сервер испытывает критические проблемы с доступностью.`;
            } else {
                testStatus = 'ВЫПОЛНЕН';
                statusColor = '#00ff41';
                badgeText = 'БЕЗ ПОВРЕЖДЕНИЙ // ЦЕЛЬ СТАБИЛЬНА';
                targetStatusText = '[ ВЕРДИКТ: СЕРВЕР ВЫДЕРЖАЛ АТАКУ ]';
                statusDescriptionRu = `> ЦЕЛЬ УСТОЯЛА.\n> Сервер работает в штатном режиме. Заявленная нагрузка (${maxUsers} потоков) обработана без критической деградации сети. Для выведения узла из строя требуется увеличить количество VUs или изменить вектор.`;
            }

            console.log(`\n [>] Запись зашифрованного отчета... (Статус: ${testStatus})`);

            const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>STRESSER // ОТЧЕТ ОБ АТАКЕ</title>
    <style>
        :root {
            --bg-color: #050505;
            --panel-bg: rgba(10, 15, 20, 0.85);
            --text-main: #00ff41;
            --text-muted: #518b66;
            --accent: ${statusColor};
            --font-mono: 'Courier New', Courier, monospace;
        }
        body {
            font-family: var(--font-mono);
            background-color: var(--bg-color);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            overflow-x: hidden;
        }
        #matrix-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            opacity: 0.3;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }
        header {
            border-bottom: 1px solid var(--accent);
            padding-bottom: 15px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            text-shadow: 0 0 5px var(--accent);
        }
        h1 { margin: 0; color: var(--accent); font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
        .badge {
            background: rgba(0, 0, 0, 0.7);
            color: var(--accent);
            padding: 8px 16px;
            font-weight: bold;
            border: 1px solid var(--accent);
            box-shadow: 0 0 10px var(--accent), inset 0 0 5px var(--accent);
            letter-spacing: 1px;
        }
        .card {
            background-color: var(--panel-bg);
            border: 1px solid #1f3b2b;
            padding: 25px;
            margin-bottom: 25px;
            backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            border-left: 5px solid var(--accent);
            transition: all 0.3s ease;
        }
        .card h3 { 
            margin-top: 0; 
            color: #fff; 
            border-bottom: 1px dashed var(--text-muted); 
            padding-bottom: 10px; 
            text-transform: uppercase;
        }
        .ticket-row { margin: 12px 0; display: flex; align-items: center; font-size: 16px; }
        .ticket-row strong { width: 220px; color: var(--text-muted); }
        .ticket-row span { color: #fff; font-weight: bold; letter-spacing: 1px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        
        .terminal-block {
            background: #000;
            border: 1px solid #333;
            padding: 15px;
            font-size: 14px;
            color: #ccc;
            white-space: pre-wrap;
            line-height: 1.5;
        }
        .terminal-block span.prompt { color: var(--accent); }
        
        .status-banner {
            text-align: center;
            font-size: 22px;
            font-weight: bold;
            color: var(--accent);
            border: 2px dashed var(--accent);
            padding: 15px;
            margin-bottom: 20px;
            background: rgba(0, 0, 0, 0.5);
            text-shadow: 0 0 8px var(--accent);
        }

        .author-block {
            margin-top: 50px;
            border-top: 1px dashed var(--text-muted);
            padding-top: 20px;
            text-align: center;
        }
        .author-links {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 25px;
        }
        .author-links a {
            color: var(--accent);
            text-decoration: none;
            font-weight: bold;
            padding: 5px 10px;
            border: 1px solid transparent;
            transition: 0.3s;
        }
        .author-links a:hover {
            border: 1px solid var(--accent);
            background: rgba(255, 255, 255, 0.05);
        }
        .scanlines {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 4px, 3px 100%;
            z-index: 9999;
            pointer-events: none;
            opacity: 0.15;
        }
    </style>
</head>
<body>
    <canvas id="matrix-canvas"></canvas>
    <div class="scanlines"></div>
    
    <div class="container">
        <header>
            <div>
                <h1>ОТЧЕТ // NET_STRESS</h1>
                <small>ВРЕМЯ: ${timestamp} | ДВИЖОК: Node.js V8 Engine</small>
            </div>
            <div class="badge">${badgeText}</div>
        </header>

        <div class="card">
            <h3>[01] ПАРАМЕТРЫ_ЦЕЛИ</h3>
            <div class="ticket-row"><strong>IP / ДОМЕН ЦЕЛИ:</strong> <span>${targetIp}</span></div>
            <div class="ticket-row"><strong>ВРЕМЯ_АТАКИ:</strong> <span>${executionTime}</span></div>
            <div class="ticket-row"><strong>МОЩНОСТЬ (VUs):</strong> <span>${maxUsers} ПОТОКОВ</span></div>
            <div class="ticket-row"><strong>ВЕКТОР_АТАКИ:</strong> <span>Standard HTTP(s) Flood</span></div>
        </div>

        <div class="grid">
            <div class="card" style="border-left-color: #333;">
                <h3>[02] ДАМП_ЛОГОВ</h3>
                <p>ПУТЬ_К_СЫРЫМ_ДАННЫМ:</p>
                <div class="terminal-block">
                    <span class="prompt">root@stresser:~#</span> ls -la logs/<br>
                    -rw-r--r-- 1 root root ... raw_report_${timestamp}.json
                </div>
            </div>
            <div class="card" style="border-left-color: #333;">
                <h3>[03] СТАТУС_СИСТЕМЫ</h3>
                <p>КОД_ЗАВЕРШЕНИЯ: <strong>${result.status !== null ? result.status : 'SIG_KILL'}</strong></p>
                <p>ВНУТРЕННИЙ_СТАТУС: <strong style="color: var(--accent);">${testStatus}</strong></p>
            </div>
        </div>

        <div class="card">
            <h3>[04] АНАЛИЗ_И_ВЕРДИКТ</h3>
            
            <div class="status-banner">
                ${targetStatusText}
            </div>

            <div class="terminal-block">
                <span class="prompt">> ИНИЦИАЛИЗАЦИЯ ДИАГНОСТИКИ...</span><br><br>
                <strong>ОЦЕНКА УРОНА:</strong><br>${statusDescriptionRu}<br><br>
                
                <span class="prompt">> СИСТЕМНАЯ СВОДКА ПО ОШИБКАМ (Если есть):</span><br>
                1. <strong>Таймауты:</strong> Если сервер перестал отвечать, значит забит канал или исчерпан пул коннектов (TCP Time-Wait).<br>
                2. <strong>Ошибки 502/503:</strong> Web-сервер (Nginx/Apache) жив, но бэкенд упал или база данных легла от перегрузки.<br>
                3. <strong>Ошибки 504:</strong> Gateway Timeout. Запросы доходят, но сервер не успевает их обрабатывать в отведенное время.
            </div>
        </div>

        <div class="author-block">
            <div style="color: var(--text-muted); font-size: 16px;">
                [ АРХИТЕКТУРА И РАЗРАБОТКА: <span style="color: #fff; font-weight: bold;">KotMir</span> ]
            </div>
            <div class="author-links">
                <a href="https://kotmir.tech" target="_blank">[ WEB: kotmir.tech ]</a>
                <a href="https://discord.gg/kotmiks" target="_blank">[ DISCORD: KOTMIKS ]</a>
                <a href="https://github.com/KotMir" target="_blank">[ GITHUB: KotMir ]</a>
            </div>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('matrix-canvas');
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        const chars = '01#$&%{}[]<>~ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const fontSize = 14;
        let columns = width / fontSize;
        let drops = [];
        for(let x = 0; x < columns; x++) drops[x] = Math.random() * height;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            columns = width / fontSize;
            drops = [];
            for(let x = 0; x < columns; x++) drops[x] = Math.random() * height;
        });

        function drawMatrix() {
            ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '${statusColor === '#ff003c' ? '#ff003c' : (statusColor === '#f39c12' ? '#f39c12' : '#00ff41')}'; 
            ctx.font = fontSize + 'px monospace';
            
            for(let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if(drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        setInterval(drawMatrix, 35);
    </script>
</body>
</html>`;

            fs.writeFileSync(htmlReportPath, htmlContent, 'utf8');
            console.log(`\n [OK] ОТЧЕТ СГЕНЕРИРОВАН >> ${htmlReportPath}\n`);
        });
    });
});