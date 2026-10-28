import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { useStore } from '../../data/AppStore';
import { addDays, periodKey, periodStart, shiftPeriod } from '../../game/dates';
import { uid } from '../../game/mutations';
import { SUB_XP, TODO_TABS, tabOf, type TodoTab } from '../../game/rules';
import { todoXp } from '../../game/todos';
import type { Diff, PeriodScope, Scope, Sub, Todo } from '../../game/types';
import { dayLabel, periodLabel } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { SheetHead, useSheet, useToast } from '../../ui/overlays';
import { Button, Card, Field, IconButton, Segmented } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';

export function Input(props: React.ComponentProps<typeof TextInput> & { small?: boolean }) {
  const { c } = useTheme();
  const [focus, setFocus] = useState(false);
  const { small, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...rest}
      onFocus={(e) => {
        setFocus(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        rest.onBlur?.(e);
      }}
      style={[
        {
          height: small ? 42 : 50,
          borderWidth: 1.5,
          borderColor: focus ? c.accent : c.line,
          borderRadius: 13,
          backgroundColor: c.surface,
          paddingHorizontal: 14,
          fontSize: small ? 15 : 16,
          fontFamily: fonts.body,
          color: c.ink,
          outlineStyle: 'none',
        } as object,
        style,
      ]}
    />
  );
}

/** Period navigator used in the To-dos tab and in the form. */
export function PeriodNav({ label, sub, onPrev, onNext, prevLabel, nextLabel }: { label: string; sub?: React.ReactNode; onPrev: () => void; onNext: () => void; prevLabel: string; nextLabel: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <IconButton icon="left" label={prevLabel} onPress={onPrev} />
      <View style={{ flex: 1, alignItems: 'center', gap: 1 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 15, textAlign: 'center' }}>{label}</T>
        {sub}
      </View>
      <IconButton icon="right" label={nextLabel} onPress={onNext} />
    </View>
  );
}

/* ---------- to-do form ---------- */

export function TodoForm({ id, close }: { id: string | null; close: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, today, actions } = useStore();
  const ui = useUi();
  const toast = useToast();
  const sheet = useSheet();
  const prev = id ? data.todos[id] : null;

  const initialScope: Scope = prev ? prev.scope : ui.todoTab === 'aktuell' ? 'ewig' : ui.todoTab;
  const [title, setTitle] = useState(prev?.title ?? '');
  const [scope, setScope] = useState<Scope>(initialScope);
  const [diff, setDiff] = useState<Diff>(prev?.diff ?? 1);
  const [day, setDay] = useState<string>(() => {
    if (prev && prev.scope !== 'ewig' && prev.period) return periodStart(prev.scope, prev.period);
    if (!prev && ui.todoTab !== 'aktuell' && ui.todoCursor) return ui.todoCursor;
    return today;
  });
  const [subs, setSubs] = useState<Sub[]>(prev ? prev.subs.map((s) => ({ ...s })) : []);
  const [newSub, setNewSub] = useState('');
  const [err, setErr] = useState(false);

  const tab = tabOf(scope);
  const tomorrow = addDays(today, 1);

  const addNewSub = () => {
    const v = newSub.trim();
    if (!v) return;
    setSubs((s) => [...s, { id: uid('s'), title: v.slice(0, 120), done: false, doneOn: null }]);
    setNewSub('');
  };

  const submit = () => {
    const name = title.trim();
    if (!name) {
      setErr(true);
      return;
    }
    const all = newSub.trim() ? [...subs, { id: uid('s'), title: newSub.trim(), done: false, doneOn: null }] : subs;
    const cleanSubs = all.filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim().slice(0, 120) }));
    const period = scope === 'ewig' ? null : periodKey(scope, day);
    actions.saveTodo(id, { title: name.slice(0, 140), scope, period, diff, subs: cleanSubs });
    if (id) toast(t('toast.saved'));
    else {
      toast(scope === 'tag' && period! > today ? t('toast.plannedFor', { when: dayLabel(period!, today) }) : t('toast.todoCreated'));
      const tb = tabOf(scope);
      if (ui.todoTab !== tb || (tb !== 'aktuell' && periodKey(tb, ui.todoCursor ?? today) !== period)) {
        ui.set({ todoTab: tb, todoCursor: tb === 'aktuell' ? null : day });
      }
      if (scope === 'tag' && period! > today) ui.set({ showPlanned: true });
    }
    close();
  };

  const setTab = (v: TodoTab) => {
    if (v === 'aktuell') {
      if (tabOf(scope) !== 'aktuell') setScope('ewig');
    } else {
      if (tabOf(scope) === 'aktuell') setDay(today);
      setScope(v);
    }
  };

  const dueValue = scope === 'ewig' ? 'none' : scope === 'tag' ? (day === today ? 'today' : day === tomorrow ? 'tomorrow' : 'keep') : null;
  const dueOptions = [
    { key: 'none', label: t('todos.noDate') },
    { key: 'today', label: t('day.today') },
    { key: 'tomorrow', label: t('day.tomorrow') },
    ...(dueValue === 'keep' ? [{ key: 'keep', label: dayLabel(day, today) }] : []),
  ];

  return (
    <View>
      <SheetHead title={id ? t('todoForm.editTitle') : t('todoForm.newTitle')} onClose={close} />
      <View style={{ gap: 16 }}>
        <Field label={t('todoForm.what')}>
          <Input
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setErr(false);
            }}
            maxLength={140}
            placeholder={t('todoForm.placeholder')}
            autoFocus={!id}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel={t('todoForm.what')}
          />
        </Field>
        <Field label={t('todoForm.list')}>
          <Segmented label={t('todoForm.list')} value={tab} onChange={setTab} options={TODO_TABS.map((k) => ({ key: k, label: t(`todos.tab.${k}`) }))} />
        </Field>
        {tab === 'aktuell' ? (
          <Field label={t('todoForm.due')}>
            <Segmented
              label={t('todoForm.due')}
              value={dueValue}
              onChange={(v) => {
                if (v === 'none') setScope('ewig');
                else if (v === 'today') {
                  setScope('tag');
                  setDay(today);
                } else if (v === 'tomorrow') {
                  setScope('tag');
                  setDay(tomorrow);
                }
              }}
              options={dueOptions}
            />
          </Field>
        ) : (
          <Field label={t('todoForm.period')}>
            <Card pad={6}>
              <PeriodNav
                label={periodLabel(scope as PeriodScope, day, today)}
                onPrev={() => setDay(shiftPeriod(scope as PeriodScope, day, -1))}
                onNext={() => setDay(shiftPeriod(scope as PeriodScope, day, 1))}
                prevLabel={t('todoForm.earlier')}
                nextLabel={t('todoForm.later')}
              />
            </Card>
          </Field>
        )}
        <Field label={t('todoForm.difficulty')}>
          <Segmented
            label={t('todoForm.difficulty')}
            value={diff}
            onChange={(v) => setDiff(v as Diff)}
            options={([1, 2, 3] as Diff[]).map((v) => ({ key: v, label: t(`diff.${v}`), sub: '+' + todoXp({ scope, diff: v }) }))}
          />
        </Field>
        <Field label={t('todoForm.subs')} hint={t('todoForm.subsHint', { xp: SUB_XP })}>
          <View style={{ gap: 6 }}>
            {subs.map((s, i) => (
              <View key={s.id} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Input
                  small
                  style={{ flex: 1 }}
                  value={s.title}
                  maxLength={120}
                  accessibilityLabel={t('todoForm.subs')}
                  onChangeText={(v) => setSubs((x) => x.map((y, j) => (j === i ? { ...y, title: v } : y)))}
                />
                <IconButton icon="x" label={t('todoForm.removeSub')} onPress={() => setSubs((x) => x.filter((y) => y.id !== s.id))} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Input
                small
                style={{ flex: 1 }}
                value={newSub}
                onChangeText={setNewSub}
                placeholder={t('todos.addSub')}
                maxLength={120}
                accessibilityLabel={t('todoForm.newSub')}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={addNewSub}
              />
              <IconButton icon="plus" label={t('todos.addSub')} onPress={addNewSub} />
            </View>
          </View>
        </Field>
        {err ? (
          <T v="small" color={c.danger}>
            {t('todoForm.errTitle')}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          {id ? (
            <Button
              kind="dangerGhost"
              icon="trash"
              label={t('common.delete')}
              style={{ flexGrow: 1, flexBasis: 140 }}
              onPress={() => sheet.open((cl) => <ConfirmDelete kind="todo" id={id} close={cl} />, t('confirm.label'))}
            />
          ) : null}
          <Button label={id ? t('common.save') : t('common.create')} onPress={submit} style={{ flexGrow: 1, flexBasis: 140 }} />
        </View>
      </View>
    </View>
  );
}

/* ---------- options menu ---------- */

export function TodoMenu({ todo, close }: { todo: Todo; close: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { today, actions } = useStore();
  const sheet = useSheet();
  const toast = useToast();
  const canMove = !todo.done && todo.scope !== 'ewig' && todo.period !== periodKey(todo.scope, today);
  const items: { key: string; icon: 'edit' | 'move' | 'trash'; label: string; danger?: boolean; onPress: () => void }[] = [
    { key: 'edit', icon: 'edit', label: t('common.edit'), onPress: () => sheet.open((cl) => <TodoForm id={todo.id} close={cl} />, t('todoForm.editTitle')) },
  ];
  if (canMove) {
    items.push({
      key: 'move',
      icon: 'move',
      label: t(`menu.moveTo.${todo.scope}`),
      onPress: () => {
        actions.moveTodoToCurrent(todo.id);
        toast(t('toast.moved'));
        close();
      },
    });
  }
  items.push({
    key: 'del',
    icon: 'trash',
    label: t('common.delete'),
    danger: true,
    onPress: () => sheet.open((cl) => <ConfirmDelete kind="todo" id={todo.id} close={cl} />, t('confirm.label')),
  });
  return (
    <View>
      <SheetHead title={todo.title} onClose={close} />
      <View style={{ gap: 6 }}>
        {items.map((i) => (
          <Pressable
            key={i.key}
            onPress={i.onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Icon name={i.icon} color={i.danger ? c.danger : c.ink} />
            <T v="bold" color={i.danger ? c.danger : c.ink}>
              {i.label}
            </T>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ---------- delete confirmation ---------- */

export function ConfirmDelete({ kind, id, close }: { kind: 'todo' | 'routine'; id: string; close: () => void }) {
  const { t } = useTranslation();
  const { data, actions } = useStore();
  const toast = useToast();
  const ui = useUi();
  const item = kind === 'todo' ? data.todos[id] : data.routines[id];
  if (!item) return null;
  const note =
    kind === 'todo'
      ? (item as Todo).done || (item as Todo).subs.some((s) => s.done)
        ? t('confirm.todoKeepsXp')
        : t('confirm.irreversible')
      : t('confirm.routine');
  return (
    <View>
      <SheetHead title={t('confirm.title', { title: item.title })} onClose={close} />
      <T muted style={{ marginBottom: 16 }}>
        {note}
      </T>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Button kind="ghost" label={t('common.keep')} onPress={close} style={{ flexGrow: 1, flexBasis: 140 }} />
        <Button
          kind="danger"
          label={t('common.delete')}
          style={{ flexGrow: 1, flexBasis: 140 }}
          onPress={() => {
            if (kind === 'todo') {
              actions.deleteTodo(id);
              toast(t('toast.todoDeleted'));
            } else {
              actions.deleteRoutine(id);
              if (ui.expanded.has(id)) ui.toggleExpanded(id);
              toast(t('toast.routineDeleted'));
            }
            close();
          }}
        />
      </View>
    </View>
  );
}
