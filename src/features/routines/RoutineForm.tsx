import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useStore, type RoutineDraft } from '../../data/AppStore';
import { ROUT_BONUS, ROUT_XP, ROUTINE_SCOPES } from '../../game/rules';
import { ROUTINE_SLOTS, type SlotGroupKey } from '../../game/routines';
import type { RoutineScope } from '../../game/types';
import { useTheme } from '../../theme/ThemeProvider';
import { SheetHead, useSheet, useToast } from '../../ui/overlays';
import { Button, Card, Field, Segmented, Stepper } from '../../ui/primitives';
import { T } from '../../ui/Text';
import { useUi } from '../../ui/uiState';
import { ConfirmDelete, Input } from '../todos/sheets';

const GRID_GAP = 6;

export const EMOJIS = ['🏃', '🚶', '💪', '🧘', '💧', '🥗', '📚', '✍️', '🧠', '🛏️', '🚿', '🦷', '🦶', '💊', '🧹', '🧺', '🌱', '🐾', '📞', '💰', '🎯', '🎸', '☀️', '🌙'];

export const SUGGESTIONS: (Omit<RoutineDraft, 'title'> & { key: string })[] = [
  { key: 'run', emoji: '🏃', scope: 'woche', target: 3 },
  { key: 'toenails', emoji: '🦶', scope: 'monat', target: 1 },
  { key: 'water', emoji: '💧', scope: 'tag', target: 8 },
  { key: 'read', emoji: '📚', scope: 'tag', target: 1, slot: 'evening' },
  { key: 'tidy', emoji: '🧹', scope: 'woche', target: 1 },
  { key: 'dentist', emoji: '🦷', scope: 'jahr', target: 2 },
];

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
  const [slot, setSlot] = useState<SlotGroupKey>(prev?.slot ?? preset?.slot ?? 'any');
  const [target, setTarget] = useState(prev ? Math.max(1, prev.target) : (preset?.target ?? (ui.routScope === 'woche' ? 3 : 1)));
  const [err, setErr] = useState(false);
  const [gridW, setGridW] = useState(0);
  // 8 columns like the prototype, sized from the measured row width.
  const cell = gridW ? Math.floor((gridW - GRID_GAP * 7) / 8) : 36;

  const submit = () => {
    const name = title.trim();
    if (!name) {
      setErr(true);
      return;
    }
    actions.saveRoutine(id, { title: name.slice(0, 80), emoji, scope, target, slot: slot === 'any' ? undefined : slot });
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
          <Segmented label={t('routineForm.rhythm')} value={scope} onChange={setScope} options={ROUTINE_SCOPES.map((k) => ({ key: k, label: t(`routines.scope.${k}`) }))} />
        </Field>
        <Field label={t('routineForm.slot')}>
          <Segmented<SlotGroupKey>
            label={t('routineForm.slot')}
            value={slot}
            onChange={setSlot}
            options={(['any', ...ROUTINE_SLOTS] as SlotGroupKey[]).map((k) => ({ key: k, label: t(`routines.slot.${k}`) }))}
          />
        </Field>
        <Field label={t('routineForm.target')}>
          <Card pad={12}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <T v="bold" style={{ flexShrink: 1 }}>
                {t('routineForm.targetValue', { count: target, per: t(`routines.per.${scope}`) })}
              </T>
              <Stepper value={target} onChange={setTarget} max={50} decLabel={t('common.less')} incLabel={t('common.more')} />
            </View>
          </Card>
          <T v="small" muted>
            {t('routineForm.xpInfo', { xp: ROUT_XP[scope], bonus: ROUT_BONUS[scope], when: t(`routineForm.when.${scope}`) })}
          </T>
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
