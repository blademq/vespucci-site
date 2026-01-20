import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import html
import json
import datetime

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = "8402821027:AAEZQLOqFRIcoUsMDmzaEuJzENACrjSaSQ0"  # Замените на ваш токен
ADMIN_CHAT_ID = "1675531783"  # Замените на ваш Chat ID

# Файл для хранения сообщений
MESSAGES_FILE = "messages.json"

# Команда /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправляет приветственное сообщение при команде /start."""
    user = update.effective_user
    welcome_text = f"""
👋 Привет, {user.first_name}!

🤖 Я - бот для приема сообщений с сайта "Научись и не ошибись".

📨 Сообщения с сайта автоматически приходят в этот чат.

📊 Статистика:
• /stats - Показать статистику сообщений
• /recent - Последние 5 сообщений
• /help - Помощь по командам

💡 Для связи с администраторами используйте сайт.
    """
    await update.message.reply_text(welcome_text)

# Команда /help
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Отправляет помощь по командам."""
    help_text = """
📋 Доступные команды:

/start - Начало работы с ботом
/stats - Статистика сообщений
/recent - Последние 5 сообщений
/clear - Очистить все сообщения (только для админов)
/help - Эта справка

📨 Сообщения с сайта приходят автоматически.
    """
    await update.message.reply_text(help_text)

# Команда /stats
async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Показывает статистику сообщений."""
    try:
        with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
            messages = json.load(f)
        
        total = len(messages)
        today = datetime.date.today()
        today_count = sum(1 for msg in messages 
                         if datetime.datetime.fromisoformat(msg['timestamp']).date() == today)
        
        # Группировка по темам
        topics = {}
        for msg in messages:
            topic = msg.get('subject', 'Без темы')
            topics[topic] = topics.get(topic, 0) + 1
        
        stats_text = f"""
📊 Статистика сообщений:

• Всего сообщений: {total}
• Сегодня: {today_count}
• По темам:
"""
        for topic, count in topics.items():
            stats_text += f"  - {topic}: {count}\n"
        
        await update.message.reply_text(stats_text)
    except FileNotFoundError:
        await update.message.reply_text("📭 Пока нет сообщений.")
    except Exception as e:
        logger.error(f"Ошибка при получении статистики: {e}")
        await update.message.reply_text("❌ Ошибка при получении статистики.")

# Команда /recent
async def recent(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Показывает последние 5 сообщений."""
    try:
        with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
            messages = json.load(f)
        
        if not messages:
            await update.message.reply_text("📭 Пока нет сообщений.")
            return
        
        recent_messages = messages[-5:]  # Последние 5 сообщений
        recent_text = "📨 Последние 5 сообщений:\n\n"
        
        for i, msg in enumerate(recent_messages[::-1], 1):  # В обратном порядке
            time = datetime.datetime.fromisoformat(msg['timestamp']).strftime('%d.%m.%Y %H:%M')
            recent_text += f"{i}. {time}\n"
            recent_text += f"👤 {msg.get('name', 'Неизвестно')}\n"
            recent_text += f"📞 {msg.get('contact', 'Не указан')}\n"
            recent_text += f"🏷️ {msg.get('subject', 'Без темы')}\n"
            recent_text += f"💬 {msg.get('message', '')[:100]}...\n"
            recent_text += "─" * 30 + "\n"
        
        await update.message.reply_text(recent_text)
    except FileNotFoundError:
        await update.message.reply_text("📭 Пока нет сообщений.")
    except Exception as e:
        logger.error(f"Ошибка при получении сообщений: {e}")
        await update.message.reply_text("❌ Ошибка при получении сообщений.")

# Команда /clear (только для админа)
async def clear_messages(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Очищает все сообщения (только для админа)."""
    if str(update.effective_user.id) != ADMIN_CHAT_ID:
        await update.message.reply_text("❌ Эта команда только для администратора.")
        return
    
    try:
        with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        await update.message.reply_text("✅ Все сообщения очищены.")
    except Exception as e:
        logger.error(f"Ошибка при очистке сообщений: {e}")
        await update.message.reply_text("❌ Ошибка при очистке сообщений.")

# Обработчик входящих сообщений от сайта
async def handle_website_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обрабатывает сообщения, пришедшие от сайта."""
    try:
        # Получаем текст сообщения
        message_text = update.message.text
        
        # Парсим сообщение (формат задан в JavaScript)
        if "НОВОЕ СООБЩЕНИЕ С САЙТА" in message_text:
            # Сохраняем сообщение
            save_message(message_text)
            
            # Отправляем подтверждение
            await update.message.reply_text("✅ Сообщение успешно сохранено!")
            
            # Уведомляем админа
            await context.bot.send_message(
                chat_id=ADMIN_CHAT_ID,
                text=f"📨 Новое сообщение с сайта!\n\n{message_text}",
                parse_mode='Markdown'
            )
    except Exception as e:
        logger.error(f"Ошибка обработки сообщения: {e}")

# Функция для сохранения сообщения
def save_message(message_text: str) -> None:
    """Сохраняет сообщение в файл."""
    try:
        # Парсим сообщение
        lines = message_text.split('\n')
        message_data = {
            'timestamp': datetime.datetime.now().isoformat(),
            'raw_text': message_text
        }
        
        # Извлекаем данные
        for line in lines:
            if 'Имя:' in line:
                message_data['name'] = line.split('Имя:')[1].strip()
            elif 'Контакт:' in line:
                message_data['contact'] = line.split('Контакт:')[1].strip()
            elif 'Тема:' in line:
                message_data['subject'] = line.split('Тема:')[1].strip()
            elif 'Сообщение:' in line:
                # Берем все последующие строки как сообщение
                msg_index = lines.index(line)
                message_data['message'] = '\n'.join(lines[msg_index+1:]).strip()
                break
        
        # Загружаем существующие сообщения
        try:
            with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                messages = json.load(f)
        except FileNotFoundError:
            messages = []
        
        # Добавляем новое сообщение
        messages.append(message_data)
        
        # Сохраняем (максимум 1000 сообщений)
        if len(messages) > 1000:
            messages = messages[-1000:]
        
        with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(messages, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Сообщение сохранено: {message_data.get('name', 'Неизвестно')}")
        
    except Exception as e:
        logger.error(f"Ошибка сохранения сообщения: {e}")

# Главная функция
def main() -> None:
    """Запуск бота."""
    # Создаем Application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем команды
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("stats", stats))
    application.add_handler(CommandHandler("recent", recent))
    application.add_handler(CommandHandler("clear", clear_messages))
    
    # Регистрируем обработчик текстовых сообщений
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_website_message))
    
    # Запускаем бота
    print("🤖 Бот запущен...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()