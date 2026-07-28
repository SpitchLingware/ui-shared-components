import { DeleteForever, DragIndicator, PlaylistAdd } from '@mui/icons-material';
import {
    Box,
    ClickAwayListener,
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    Stack,
    styled,
    TextField,
    Tooltip,
} from '@mui/material';
import { blueGrey, orange } from '@mui/material/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { v4 } from 'uuid';
import { DragAndDropData, useDragAndDrop } from '../../hooks';
import { RuleComponentProps, RuleEditor } from './RuleEditor';
import { RuleBase, RuleSet, RuleSetAction, RuleSetActionsFlags } from './types';
import {
    defaultRuleSetActionsFlags,
    InRuleAction,
    rulesetActionStyles,
    toggleRulesetAction,
    UpdateSelectedFlag,
} from './utils';

export type RulePrototype<RuleExtension> = {
    label?: string;
    icon: any;
    create: CreateRuleFn<RuleExtension>;
    disabled?: boolean;
};

type CreateRuleFn<RuleExtension> = () => RuleBase<RuleExtension>;

export type RuleSetEditorProps<RuleExtension, Data> = {
    prefix?: string;
    parentAction?: RuleSetAction;
    ruleset: RuleSet<RuleExtension>;
    onChange: (
        name: string | Array<string>,
        value: any,
        updateSelected?: UpdateSelectedFlag,
    ) => void;
    onDelete?: () => void;
    data: Data;
    last?: boolean;
    wrapper: {
        static: React.ComponentType<RuleComponentProps<RuleExtension, Data>>;
        inline?: React.ComponentType<RuleComponentProps<RuleExtension, Data>>;
    };
    editField?: string;
    setEditField?: (field?: string) => void;
    prototypes: Array<RulePrototype<RuleExtension>>;
    helper?: any;
    inRuleAction?: (action: InRuleAction) => void;
    readonly?: boolean;
    // deleteLast?: boolean;
    actionFlags?: RuleSetActionsFlags;
    forceCollapse?: boolean;
    // distanceSupport?: boolean;
    dragData: DragAndDropData<string>;
    /* disable nested rulesets */
    disableNested?: boolean;
    displayError?: boolean;
    i18nTag: string;
};

export const RuleSetEditor = <Rule, Data = {}>(
    props: Omit<RuleSetEditorProps<Rule, Data>, 'dragData'>,
): ReturnType<React.FC<RuleSetEditorProps<Rule, Data>>> => {
    const { onChange, ruleset, prefix, readonly } = props;
    const realPrefix = (...values: any): string => {
        let value = values.join('.');
        /* SDAP-2942 - prefix may be undefined if the ruleset is the root */
        if (!!prefix) value = `${prefix}.${value}`;
        return value;
    };

    const dragData = useDragAndDrop<string>({
        dataObject: ruleset,
        getPath: (v) => {
            if (prefix && v.startsWith(prefix)) {
                return v.substring(prefix.length + 1);
            }
            return v;
        },
        onEnd: (update: any) => {
            if (update) {
                onChange(realPrefix('features'), update.features, 'clear');
            }
        },
    });

    return <RuleSetEditorDraggable {...props} dragData={dragData} />;
};

export const RuleSetEditorDraggable = <Rule, Data = {}>(
    props: RuleSetEditorProps<Rule, Data>,
): ReturnType<React.FC<RuleSetEditorProps<Rule, Data>>> => {
    const { t } = useTranslation();

    const {
        ruleset,
        parentAction,
        onChange,
        onDelete,
        prefix = '',
        data,
        last,
        wrapper,
        prototypes,
        helper,
        editField,
        setEditField,
        inRuleAction,
        readonly,
        actionFlags = defaultRuleSetActionsFlags(),
        forceCollapse,
        // distanceSupport,
        dragData,
        disableNested,
        displayError,
        i18nTag,
    } = props;

    const { action = 'and', features: _features = [], label = '' } = ruleset;

    const features: (RuleBase<Rule> | RuleSet<RuleBase<Rule>, {}>)[] = _features
        ? _features
        : [];

    const { draggedElement, elementOver, onDragEnd, onDragOver, onDragStart } =
        dragData;

    const dragMode = !!draggedElement;
    const [tooltipOpen, setTooltipOpen] = React.useState<boolean>(false);

    const realPrefix = (...values: any): string => {
        let value = values.join('.');
        if (prefix !== '') value = `${prefix}.${value}`;
        return value;
    };

    const handleChange =
        (name: string, convert?: (value: any) => any) => (event: any) => {
            if (readonly) return;
            let value = event?.target?.value ?? event;
            if (convert) value = convert(value);
            onChange(realPrefix(name), value);
        };

    const addElement = (rule: RuleBase<Rule>) => {
        onChange(realPrefix('features'), [...features, rule], 'set');
    };

    const deleteElement = (index: number) => {
        const _features = [...features];
        _features.splice(index, 1);
        onChange(realPrefix('features'), _features);
    };

    const shifted = typeof last === 'boolean';

    const { primary, secondary } = rulesetActionStyles(action);

    const renderListItem = (key: number, open: boolean, kid: any) => {
        const path = realPrefix('features', key);
        const isDragged = draggedElement === path;
        const isDraggedOver = !isDragged && elementOver === path;

        return (
            <Collapse key={key} in={open} timeout='auto' unmountOnExit={false}>
                <ListItem
                    key={key}
                    disablePadding
                    sx={{
                        backgroundColor: isDraggedOver
                            ? blueGrey[50]
                            : isDragged
                              ? orange[50]
                              : '#ffffff',
                    }}
                    onDragOver={(event) => {
                        /* SDAP-2967 don't call the 'onDragOver' when not in the dragMode */
                        if (readonly || !dragMode) return;

                        onDragOver(event, path);
                        event.stopPropagation();
                    }}>
                    <ListItemIcon
                        sx={{
                            cursor: readonly ? undefined : 'grab',
                            minWidth: '20px',
                            padding: '5px 0',
                        }}
                        draggable={!readonly}
                        onDragStart={(event) => {
                            if (readonly) return;

                            onDragStart(event, path);
                        }}
                        onDragEnd={(event) => {
                            if (readonly) return;

                            onDragEnd(event, path);
                        }}>
                        <DragIndicator fontSize={'small'} />
                    </ListItemIcon>
                    <Box sx={{ width: `100%`, display: 'inline-block' }}>
                        {kid}
                    </Box>
                </ListItem>
            </Collapse>
        );
    };

    return (
        <StyledRoot shifted={shifted} error={displayError}>
            {shifted ? (
                <StyledLine
                    last={last}
                    style={{
                        borderColor:
                            rulesetActionStyles(parentAction).secondary,
                    }}
                />
            ) : null}
            <ClickAwayListener onClickAway={() => setTooltipOpen(false)}>
                <Box
                    sx={{
                        position: 'relative',
                        display: 'flex',
                    }}>
                    <Box
                        sx={{
                            margin: '2px',
                            height: 24,
                            padding: '0 5px',
                            borderRadius: '5px',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            userSelect: 'none',
                            cursor: readonly ? undefined : 'pointer',
                            lineHeight: '24px',
                            whiteSpace: 'nowrap',
                            color: primary,
                            backgroundColor: secondary,
                        }}
                        onClick={() => {
                            if (readonly) return;

                            handleChange('action')(
                                toggleRulesetAction(action, actionFlags),
                            );
                        }}>
                        {t(`${i18nTag}.labels.${action}`, action)}
                    </Box>
                    <TextField
                        autoComplete={'off'}
                        type={'text'}
                        disabled={readonly}
                        margin={'none'}
                        fullWidth
                        sx={{ margin: '0 10px' }}
                        placeholder={t(
                            `${i18nTag}.labels.group_name`,
                            'Group Name',
                        )}
                        value={label}
                        variant={'standard'}
                        onChange={(event) =>
                            handleChange('label')(event.target.value)
                        }
                    />

                    <Box component={'div'} sx={{ flex: '1' }} />
                    <Stack direction='row' spacing={0.5}>
                        {prototypes.map((prt, idx) => {
                            const {
                                icon: Icon,
                                label = t(
                                    `${i18nTag}.buttons.add_rule`,
                                    'add rule',
                                ),
                                create,
                                disabled,
                            } = prt;
                            return (
                                <Tooltip title={label} key={idx}>
                                    <span>
                                        <IconButton
                                            onClick={() => addElement(create())}
                                            disabled={disabled || readonly}>
                                            <Icon fontSize={'inherit'} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            );
                        })}

                        <Tooltip
                            title={t(
                                `${i18nTag}.buttons.add_ruleset`,
                                'add group',
                            )}>
                            <span>
                                <IconButton
                                    onClick={() => {
                                        onChange(
                                            realPrefix('features'),
                                            [
                                                ...features,
                                                {
                                                    id: v4(),
                                                    type: 'ruleset',
                                                    action: 'and',
                                                    features: [],
                                                },
                                            ],
                                            'set',
                                        );
                                    }}
                                    /* disable "add ruleset" button if there are no prototypes to add */
                                    disabled={
                                        readonly ||
                                        disableNested ||
                                        prototypes.length === 0
                                    }>
                                    <PlaylistAdd fontSize={'inherit'} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        {onDelete ? (
                            <Tooltip
                                title={
                                    t(
                                        `${i18nTag}.buttons.remove_element`,
                                        'remove',
                                    ) as string
                                }>
                                <span>
                                    <IconButton
                                        onClick={onDelete}
                                        color={'error'}
                                        disabled={readonly}>
                                        <DeleteForever fontSize={'inherit'} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        ) : null}
                        {helper ? helper : null}
                    </Stack>
                </Box>
            </ClickAwayListener>
            <Collapse in={!forceCollapse}>
                <List dense>
                    {features.map((feature, fIndex: number) => {
                        const path = realPrefix('features', fIndex);

                        const isLast = fIndex + 1 === features.length;

                        let el;
                        if ('action' in feature) {
                            let force =
                                !!forceCollapse ||
                                (typeof draggedElement === 'string' &&
                                    path.startsWith(draggedElement));

                            el = (
                                <RuleSetEditorDraggable
                                    key={feature.id ?? fIndex}
                                    readonly={readonly}
                                    parentAction={action}
                                    prefix={path}
                                    wrapper={wrapper}
                                    onDelete={() => deleteElement(fIndex)}
                                    ruleset={feature}
                                    onChange={onChange}
                                    data={data}
                                    last={isLast}
                                    prototypes={prototypes}
                                    editField={editField}
                                    setEditField={setEditField}
                                    inRuleAction={inRuleAction}
                                    actionFlags={actionFlags}
                                    forceCollapse={force}
                                    // distanceSupport={distanceSupport}
                                    dragData={dragData}
                                    disableNested={disableNested}
                                    i18nTag={i18nTag}
                                />
                            );
                        } else {
                            el = (
                                <RuleEditor<Rule, Data>
                                    key={feature.id ?? fIndex}
                                    readonly={readonly}
                                    parentAction={action}
                                    prefix={realPrefix('features', fIndex)}
                                    wrapper={wrapper}
                                    rule={feature}
                                    editField={editField}
                                    setEditField={setEditField}
                                    onDelete={() => deleteElement(fIndex)}
                                    onChange={onChange}
                                    data={data}
                                    last={isLast}
                                    inRuleAction={inRuleAction}
                                    i18nTag={i18nTag}
                                />
                            );
                        }

                        return renderListItem(fIndex, true, el);
                    })}
                    {renderListItem(features.length, dragMode, null)}
                </List>
            </Collapse>
        </StyledRoot>
    );
};

const StyledRoot = styled('div', {
    shouldForwardProp(propName: PropertyKey): boolean {
        return propName !== 'shifted';
    },
})<{
    shifted: boolean;
    error?: boolean;
}>(({ shifted, error }) => ({
    position: 'relative',
    border: `1px solid ${error ? '#ff0000' : '#cccccc'}`,
    borderRadius: '5px',
    marginTop: 5,
    padding: 5,
    marginLeft: shifted ? 20 : undefined,
    backgroundColor: 'white',
}));

const StyledLine = styled('div', {
    shouldForwardProp(propName: PropertyKey): boolean {
        return propName !== 'last';
    },
})<{
    last: boolean;
}>(({ last }) => ({
    boxSizing: 'border-box',
    position: 'absolute',
    border: '1px solid',
    height: last ? 'calc(50% + 2px + 5px)' : 'calc(100% + 2px + 5px)',
    // width: 2,
    top: -6,
    left: -15,
    '&:before': {
        position: 'absolute',
        content: '""',
        border: '1px solid',
        borderColor: 'inherit',
        top: last ? '100%' : '50%',
        left: -1,
        // height: 2,
        width: 13,
    },
}));
