import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { SUB_XP } from '../../game/rules';
import { isLate, todoProgress, todoXp } from '../../game/todos';
import type { Todo } from '../../game/types';
import { dayLabel } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { useSheet } from '../../ui/overlays';
import { Checkbox, IconButton, Pips, ProgressBar, XpTag } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { Input, TodoMenu } from './sheets';

export function TodoCard({ todo }: { todo: Todo }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { today, actions } = useStore();
  const sheet = useSheet();
  const [newSub, setNewSub] = useState('');
  // The subtask field stays hidden until asked for, so cards stay calm.
  const [adding, setAdding] = useState(false);
  const subs = todo.subs;
  const sd = subs.filter((s) => s.done).length;
  const late = isLate(todo, today);
  const doneWhen = todo.done && todo.doneOn ? dayLabel(todo.doneOn, today) : null;

  const submitSub = () => {
    if (!newSub.trim()) return;
    actions.addSub(todo.id, newSub);
    setNewSub('');
  };

  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: radius.r, boxShadow: c.shadow, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Checkbox checked={todo.done} onPress={() => actions.toggleTodo(todo.id)} label={t('todos.check', { title: todo.title })} />
        <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <T v="bold" color={todo.done ? c.muted : c.ink} style={todo.done && { textDecorationLine: 'line-through' }}>
            {todo.title}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 6, marginTop: 5 }}>
            <XpTag xp={todoXp(todo)} suffix />
            <Pips diff={todo.diff} label={t('diff.label', { level: t(`diff.${todo.diff}`) })} />
            {subs.length ? (
              <T v="tiny" muted>
                {t('todos.subsSummary', { done: sd, total: subs.length })}
              </T>
            ) : null}
            {late ? (
              <T v="tiny" color={c.flame} style={{ fontFamily: fonts.bodyBold }}>
                {t('todos.overdue')}
              </T>
            ) : todo.scope === 'tag' && !todo.done && todo.period ? (
              <View style={{ backgroundColor: c.wPlum2, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1 }}>
                <T v="tiny" color={c.plumText} style={{ fontFamily: fonts.bodyBold }}>
                  {dayLabel(todo.period, today)}
                </T>
              </View>
            ) : null}
            {doneWhen ? (
              <T v="tiny" muted>
                {t('todos.doneOn', { when: doneWhen })}
              </T>
            ) : null}
          </View>
        </View>
        <IconButton icon="dots" label={t('todos.options', { title: todo.title })} onPress={() => sheet.open((cl) => <TodoMenu todo={todo} close={cl} />, todo.title)} />
      </View>
      {subs.length ? <ProgressBar pct={todoProgress(todo) * 100} small /> : null}
      {!todo.done ? (
        <View style={{ paddingLeft: 40, gap: 2 }}>
          {subs.map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 }}>
              <Checkbox small checked={s.done} onPress={() => actions.toggleSub(todo.id, s.id)} label={t('todos.check', { title: s.title })} />
              <T style={[{ flex: 1, fontSize: 15 }, s.done && { color: c.muted, textDecorationLine: 'line-through' }]}>{s.title}</T>
              <XpTag xp={SUB_XP} />
            </View>
          ))}
          {adding ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Input
                small
                autoFocus
                value={newSub}
                onChangeText={setNewSub}
                onBlur={() => !newSub.trim() && setAdding(false)}
                placeholder={t('todos.addSub')}
                maxLength={120}
                accessibilityLabel={t('todos.addSubTo', { title: todo.title })}
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={submitSub}
                style={{ flex: 1, height: 38, borderRadius: 10, paddingHorizontal: 10, fontSize: 15 }}
              />
              <IconButton icon="plus" label={t('todos.addSub')} onPress={submitSub} />
            </View>
          ) : (
            <Pressable
              onPress={() => setAdding(true)}
              accessibilityRole="button"
              accessibilityLabel={t('todos.addSubTo', { title: todo.title })}
              hitSlop={6}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 }}
            >
              <Icon name="plus" size={16} color={c.muted} />
              <T v="smallBold" muted>
                {t('todos.addSub')}
              </T>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}
