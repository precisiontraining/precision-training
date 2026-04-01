.coach {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 280px);
  min-height: 500px;
}

.header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.icon { font-size: 28px; }

.title {
  font-size: 22px;
  font-weight: 800;
  color: var(--gold);
}

.sub { font-size: 13px; color: var(--gray); }

.chatWindow {
  flex: 1;
  overflow-y: auto;
  background: #111;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 12px;
}

.msgWrap {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msgUser { flex-direction: row-reverse; }

.msgAi { flex-direction: row; }

.avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  background: rgba(200, 169, 110, 0.2);
  border: 1px solid var(--gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: var(--gold);
}

.msgInner { display: flex; flex-direction: column; gap: 4px; max-width: 75%; }

.msgUser .msgInner { align-items: flex-end; }

.bubble {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.msgAi .bubble {
  background: var(--card-bg2);
  color: var(--white);
  border-radius: 4px 12px 12px 12px;
}

.msgUser .bubble {
  background: var(--gold);
  color: #000;
  font-weight: 600;
  border-radius: 12px 4px 12px 12px;
}

.time {
  font-size: 10px;
  color: var(--gray);
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.chip {
  padding: 7px 14px;
  border: 1px solid var(--gold);
  border-radius: 20px;
  font-size: 12px;
  color: var(--gold);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font);
  font-weight: 600;
}

.chip:hover { background: var(--gold); color: #000; }

.inputRow {
  display: flex;
  gap: 10px;
}

.input {
  flex: 1;
  background: var(--card-bg2);
  border: 1px solid var(--border);
  color: var(--white);
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-family: var(--font);
  transition: border-color 0.2s;
}

.input:focus { border-color: var(--gold); }
.input::placeholder { color: var(--gray); }

.sendBtn {
  padding: 14px 20px;
  background: var(--gold);
  color: #000;
  border-radius: 10px;
  font-weight: 900;
  font-size: 18px;
  font-family: var(--font);
  cursor: pointer;
  transition: all 0.2s;
}

.sendBtn:hover { background: var(--gold-light); }
