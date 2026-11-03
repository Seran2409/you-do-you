import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore, type RoutineDraft } from '../../data/AppStore';
import { ROUT_BONUS, ROUT_XP, ROUTINE_SCOPES } from '../../game/rules';
import { ROUTINE_SLOTS, slotParts, slotsOf } from '../../game/routines';
import type { RoutineScope, RoutineSlot } from '../../game/types';
import { joinList } from '../../i18n/format';
import { useTheme } from '../../theme/ThemeProvider';
import { SheetHead, useSheet, useToast } from '../../ui/overlays';
import type { IconName } from '../../ui/Icon';
import { Button, Card, Chip, Field, Segmented, Stepper } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { ConfirmDelete, Input } from '../todos/sheets';

const GRID_GAP = 6;

export const EMOJIS = ['🏃', '🚶', '💪', '🧘', '💧', '🥗', '📚', '✍️', '🧠', '🛏️', '🚿', '🦷', '🦶', '💊', '🧹', '🧺', '🌱', '🐾', '📞', '💰', '🎯', '🎸', '☀️', '🌙'];

export const SUGGESTIONS: (Omit<RoutineDraft, 'title'> & { key: string })[] = [
  { key: 'run', emoji: '🏃', scope: 'woche', target: 3 },
  { key: 'toenails', emoji: '🦶', scope: 'monat', target: 1 },
  { key: 'water', emoji: '💧', scope: 'tag', target: 8 },
  { key: 'read', emoji: '📚', scope: 'tag', target: 1, slots: ['evening'] },
  { key: 'tidy', emoji: '🧹', scope: 'woche', target: 1 },
  { key: 'dentist', emoji: '🦷', scope: 'jahr', target: 2 },
];

const SLOT_ICON: Record<RoutineSlot, IconName> = { morning: 'sunrise', midday: 'sun', evening: 'moon' };

/** How many times of day can be picked: one per daily repetition (up to three), otherwise one. */
const maxSlots = (scope: RoutineScope, target: number) => (scope === 'tag' ? Math.min(target, ROUTINE_SLOTS.length) : 1);

export function RoutineForm({ id, preset, close }: { id: string | null; preset?: RoutineDraft; close: () => void }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, actions } = useStore();
  const ui = useUi();
  const toast = useToast();
  const sheet = useSheet();
  const prev = id ? data.routines[id] : null;
  const [title, setTitle] = useState(prev?.title ?? preset?.title ?? '');
  const [emoji, setEmoji] = useState(prev?.emoji ?? preset?.emoji ?? '🏃');
  const [scope, setScope] = useState<RoutineScope>(prev?.scope ?? preset?.scope ?? ui.routScope);
  const [slots, setSlots] = useState<RoutineSlot[]>(prev ? slotsOf(prev) : (preset?.slots ?? []));
  // New routines always start at once per period; suggestions bring their own number.
  const [target, setTarget] = useState(prev ? Math.max(1, prev.target) : (preset?.target ?? 1));
  const [err, setErr] = useState(false);
  const [gridW, setGridW] = useState(0);
  // 8 columns like the prototype, sized from the measured row width.
  const cell = gridW ? Math.floor((gridW - GRID_GAP * 7) / 8) : 36;

  const max = maxSlots(scope, target);
  const changeScope = (v: RoutineScope) => {
    setScope(v);
    setSlots((l) => l.slice(0, maxSlots(v, target)));
  };
  const changeTarget = (v: number) => {
    setTarget(v);
    setSlots((l) => l.slice(0, maxSlots(scope, v)));
  };
  const toggleSlot = (k: RoutineSlot) => {
    if (slots.includes(k)) setSlots(slots.filter((x) => x !== k));
    else if (max === 1) setSlots([k]);
    else if (slots.length < max) setSlots(ROUTINE_SLOTS.filter((x) => x === k || slots.includes(x)));
  };
  // Preview of how the repetitions are spread over the picked times of day.
  const parts = slots.length > 1 ? slotParts({ id: '', title, emoji, scope, target, slots, createdAt: '', order: 0 }, undefined) : [];

  const submit = () => {
    const name = title.trim();
    if (!name) {
      setErr(true);
      return;
    }
    actions.saveRoutine(id, { title: name.slice(0, 80), emoji, scope, target, slots });
    if (id) toast(t('toast.saved'));
    else {
      toast(t('toast.routineCreated'));
      ui.set({ routScope: scope });
    }
    close();
  };

  return (
    <View>
      <SheetHead title={id ? t('routineForm.editTitle') : t('routineForm.newTitle')} onClose={close} />
      <View style={{ gap: 16 }}>
        <Field label={t('routineForm.what')}>
          <Input
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setErr(false);
            }}
            maxLength={80}
            placeholder={t('routineForm.placeholder')}
            autoFocus={!id && !preset}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel={t('routineForm.what')}
          />
        </Field>
        <Field label={t('routineForm.symbol')}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('routineForm.symbol')}
            onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}
          >
            {EMOJIS.map((e) => {
              const on = e === emoji;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  accessibilityRole="radio"
                  aria-checked={on}
                  accessibilityLabel={e}
                  style={{
                    width: cell,
                    height: cell,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: on ? c.plumText : c.line,
                    backgroundColor: on ? c.wPlum : c.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T style={{ fontSize: 20, lineHeight: 26 }}>{e}</T>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field label={t('routineForm.rhythm')}>
          <Segmented label={t('routineForm.rhythm')} value={scope} onChange={changeScope} options={ROUTINE_SCOPES.map((k) => ({ key: k, label: t(`routines.scope.${k}`) }))} />
        </Field>
        <Field label={t('routineForm.target')}>
          <Card pad={12}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <T v="bold" style={{ flexShrink: 1 }}>
                {t('routineForm.targetValue', { count: target, per: t(`routines.per.${scope}`) })}
              </T>
              <Stepper value={target} onChange={changeTarget} max={50} decLabel={t('common.less')} incLabel={t('common.more')} />
            </View>
          </Card>
          <T v="small" muted>
            {t('routineForm.xpInfo', { xp: ROUT_XP[scope], bonus: ROUT_BONUS[scope], when: t(`routineForm.when.${scope}`) })}
          </T>
        </Field>
        <Field label={t('routineForm.slot')}>
          <View accessibilityRole={max === 1 ? 'radiogroup' : undefined} accessibilityLabel={t('routineForm.slot')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip kind={max === 1 ? 'radio' : 'checkbox'} icon="clock" label={t('routines.slot.any')} selected={!slots.length} onPress={() => setSlots([])} />
            {ROUTINE_SLOTS.map((k) => (
              <Chip key={k} kind={max === 1 ? 'radio' : 'checkbox'} icon={SLOT_ICON[k]} label={t(`routines.slot.${k}`)} selected={slots.includes(k)} onPress={() => toggleSlot(k)} />
            ))}
          </View>
          {max > 1 ? (
            <T v="small" muted>
              {parts.length
                ? t('routineForm.slotsSplit', { list: joinList(parts.map((p) => t('routineForm.slotShare', { slot: t(`routines.slot.${p.slot}`), count: p.share }))) })
                : t('routineForm.slotsHint', { count: max })}
            </T>
          ) : null}
        </Field>
        {err ? (
          <T v="small" color={c.danger}>
            {t('routineForm.errTitle')}
          </T>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          {id ? (
            <Button
              kind="dangerGhost"
              icon="trash"
              label={t('common.delete')}
              style={{ flexGrow: 1, flexBasis: 140 }}
              onPress={() => sheet.open((cl) => <ConfirmDelete kind="routine" id={id} close={cl} />, t('confirm.label'))}
            />
          ) : null}
          <Button label={id ? t('common.save') : t('common.create')} onPress={submit} style={{ flexGrow: 1, flexBasis: 140 }} />
        </View>
      </View>
    </View>
  );
}
