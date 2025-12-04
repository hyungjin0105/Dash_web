import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRestaurants } from '../../hooks/useRestaurants'
import { createMenuSection, updateMenuSection } from '../../services/restaurants'
import type {
  MenuItemFormValue,
  MenuOptionChoiceFormValue,
  MenuOptionGroupFormValue,
  MenuSectionFormValues,
  MenuSectionRecord,
} from '../../types/restaurants'

const emptyItem: MenuItemFormValue = {
  name: '',
  basePrice: '',
  description: '',
}

const emptyChoice: MenuOptionChoiceFormValue = {
  label: '',
  priceDelta: '',
}

const emptyGroup: MenuOptionGroupFormValue = {
  title: '',
  isRequired: false,
  minSelections: '0',
  maxSelections: '1',
  choices: [{ ...emptyChoice }],
}

const createInitialValues = (): MenuSectionFormValues => ({
  restaurantId: '',
  title: '',
  order: '',
  items: [{ ...emptyItem }],
  optionGroups: [],
})

export const MenuSectionForm = ({
  editTarget,
  onComplete,
  allowedStoreIds,
}: {
  editTarget: MenuSectionRecord | null
  onComplete: () => void
  allowedStoreIds: string[]
}) => {
  const [values, setValues] = useState<MenuSectionFormValues>(createInitialValues())
  const [message, setMessage] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data: restaurants } = useRestaurants(allowedStoreIds)

  useEffect(() => {
    if (editTarget) {
      setEditingId(editTarget.id)
      setValues({
        restaurantId: editTarget.restaurantId ?? '',
        title: editTarget.title ?? '',
        order: String(editTarget.order ?? ''),
        items:
          editTarget.items?.map((it) => ({
            name: it.name ?? '',
            basePrice: String(it.basePrice ?? ''),
            description: it.description ?? '',
          })) ?? [{ ...emptyItem }],
        optionGroups:
          editTarget.items?.[0]?.optionGroups?.map((group) => ({
            title: group.title ?? '',
            isRequired: group.isRequired ?? false,
            minSelections: String(group.minSelections ?? 0),
            maxSelections: String(group.maxSelections ?? 1),
            choices:
              group.choices?.map((choice) => ({
                label: choice.label ?? '',
                priceDelta: String(choice.priceDelta ?? 0),
              })) ?? [{ ...emptyChoice }],
          })) ?? [],
      })
      setShowOptions(true)
    } else {
      setEditingId(null)
      setValues(createInitialValues())
    }
  }, [editTarget])

  const mutation = useMutation({
    mutationFn: async (payload: MenuSectionFormValues) => {
      if (editingId) {
        await updateMenuSection(payload.restaurantId, editingId, payload)
      } else {
        await createMenuSection(payload)
      }
    },
    onSuccess: (_data, variables) => {
      setMessage(editingId ? '메뉴 섹션이 수정되었습니다.' : '메뉴 섹션이 저장되었습니다.')
      setValues(createInitialValues())
      setEditingId(null)
      queryClient.invalidateQueries({
        queryKey: ['menu-sections', variables.restaurantId],
      })
      onComplete()
    },
    onError: () => setMessage('메뉴 저장 중 오류가 발생했습니다.'),
  })

  const handleRootChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (
    index: number,
    field: keyof MenuItemFormValue,
    newValue: string,
  ) => {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: newValue } : item)),
    }))
  }

  const handleGroupChange = (
    index: number,
    field: keyof MenuOptionGroupFormValue,
    newValue: string | boolean,
  ) => {
    setValues((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.map((group, i) =>
        i === index ? { ...group, [field]: newValue } : group,
      ),
    }))
  }

  const handleChoiceChange = (
    groupIndex: number,
    choiceIndex: number,
    field: keyof MenuOptionChoiceFormValue,
    newValue: string,
  ) => {
    setValues((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.map((group, gi) =>
        gi === groupIndex
          ? {
              ...group,
              choices: group.choices.map((choice, ci) =>
                ci === choiceIndex ? { ...choice, [field]: newValue } : choice,
              ),
            }
          : group,
      ),
    }))
  }

  const addItem = () =>
    setValues((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }))

  const removeItem = (index: number) =>
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))

  const addGroup = () =>
    setValues((prev) => ({
      ...prev,
      optionGroups: [...prev.optionGroups, { ...emptyGroup, choices: [{ ...emptyChoice }] }],
    }))

  const removeGroup = (index: number) =>
    setValues((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.filter((_, i) => i !== index),
    }))

  const addChoice = (groupIndex: number) =>
    setValues((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.map((group, gi) =>
        gi === groupIndex
          ? {
              ...group,
              choices: [...group.choices, { ...emptyChoice }],
            }
          : group,
      ),
    }))

  const removeChoice = (groupIndex: number, choiceIndex: number) =>
    setValues((prev) => ({
      ...prev,
      optionGroups: prev.optionGroups.map((group, gi) =>
        gi === groupIndex
          ? {
              ...group,
              choices: group.choices.filter((_, ci) => ci !== choiceIndex),
            }
          : group,
      ),
    }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate(values)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <h3>메뉴 섹션 추가</h3>
        <p className="helper">끌어쓰기 없이 순서대로 입력하면 저장됩니다.</p>
      </div>

      <fieldset className="form-section">
        <legend>1. 매장 선택</legend>
        <div className="form__grid">
          <label>
            운영중인 매장
            <select
              name="restaurantId"
              value={values.restaurantId}
              onChange={handleRootChange}
              required
            >
              <option value="">선택하세요</option>
              {restaurants?.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            섹션 제목
            <input
              name="title"
              value={values.title}
              onChange={handleRootChange}
              placeholder="예: 인기 메뉴"
              required
            />
          </label>
          <label>
            노출 순서 (숫자가 작을수록 위)
            <input
              name="order"
              value={values.order}
              onChange={handleRootChange}
              type="number"
              placeholder="0"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>2. 메뉴 입력</legend>
        {values.items.map((item, index) => (
          <div key={index} className="form__grid">
            <label>
              메뉴 이름
              <input
                value={item.name}
                onChange={(event) => handleItemChange(index, 'name', event.target.value)}
                placeholder="예: 직화 제육덮밥"
                required
              />
            </label>
            <label>
              기본 가격 (₩)
              <input
                type="number"
                min="0"
                value={item.basePrice}
                onChange={(event) => handleItemChange(index, 'basePrice', event.target.value)}
                required
              />
            </label>
            <label>
              설명
              <textarea
                rows={2}
                value={item.description}
                onChange={(event) => handleItemChange(index, 'description', event.target.value)}
                placeholder="간단한 설명"
              />
            </label>
            {values.items.length > 1 && (
              <button type="button" onClick={() => removeItem(index)} className="button-ghost">
                메뉴 삭제
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addItem} className="button-ghost">
          + 메뉴 추가
        </button>
      </fieldset>

      <fieldset className="form-section">
        <legend>
          3. 옵션 그룹{' '}
          <button
            type="button"
            onClick={() => setShowOptions((prev) => !prev)}
            className="button-ghost"
          >
            {showOptions ? '접기' : '옵션 추가'}
          </button>
        </legend>
        {showOptions && (
          <>
            {values.optionGroups.length === 0 && (
              <button type="button" onClick={addGroup} className="button-ghost">
                + 옵션 그룹 만들기
              </button>
            )}
            {values.optionGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="form__grid">
                <label>
                  옵션 그룹 이름
                  <input
                    value={group.title}
                    onChange={(event) =>
                      handleGroupChange(groupIndex, 'title', event.target.value)
                    }
                    placeholder="예: 맵기 선택"
                  />
                </label>
                <label>
                  최소 선택 수
                  <input
                    type="number"
                    min="0"
                    value={group.minSelections}
                    onChange={(event) =>
                      handleGroupChange(groupIndex, 'minSelections', event.target.value)
                    }
                  />
                </label>
                <label>
                  최대 선택 수
                  <input
                    type="number"
                    min="1"
                    value={group.maxSelections}
                    onChange={(event) =>
                      handleGroupChange(groupIndex, 'maxSelections', event.target.value)
                    }
                  />
                </label>
                <label>
                  필수 선택
                  <input
                    type="checkbox"
                    checked={group.isRequired}
                    onChange={(event) =>
                      handleGroupChange(groupIndex, 'isRequired', event.target.checked)
                    }
                  />
                </label>
                <div className="form__grid">
                  {group.choices.map((choice, choiceIndex) => (
                    <div key={choiceIndex}>
                      <label>
                        선택지
                        <input
                          value={choice.label}
                          onChange={(event) =>
                            handleChoiceChange(groupIndex, choiceIndex, 'label', event.target.value)
                          }
                          placeholder="예: 순한맛"
                        />
                      </label>
                      <label>
                        추가 금액
                        <input
                          type="number"
                          value={choice.priceDelta}
                          onChange={(event) =>
                            handleChoiceChange(
                              groupIndex,
                              choiceIndex,
                              'priceDelta',
                              event.target.value,
                            )
                          }
                          placeholder="0"
                        />
                      </label>
                      {group.choices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChoice(groupIndex, choiceIndex)}
                          className="button-ghost"
                        >
                          선택지 삭제
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addChoice(groupIndex)}
                  className="button-ghost"
                >
                  + 선택지 추가
                </button>
                <button
                  type="button"
                  onClick={() => removeGroup(groupIndex)}
                  className="button-ghost"
                >
                  옵션 그룹 삭제
                </button>
              </div>
            ))}
            {values.optionGroups.length > 0 && (
              <button type="button" onClick={addGroup} className="button-ghost">
                + 옵션 그룹 추가
              </button>
            )}
          </>
        )}
      </fieldset>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '저장 중…' : '메뉴 섹션 저장'}
      </button>
      {message && <p className="form__message">{message}</p>}
    </form>
  )
}
