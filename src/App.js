// @ts-ignore
import React, {useRef} from 'react';
import './App.css';
import {DndProvider, useDrag, useDrop} from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {ItemTypes} from "./ItemTypes";
import {useState} from "react";
import {all_blocks} from "./AllBlocks";
import {COLUMN_NAMES} from "./constants";

const MovableItem = ({name, index, moveCardHandler, setItems}) => {
    // @ts-ignore
    const changeItemColumn = (currentItem, columnName) => {
        setItems((prevState) => {
            return prevState.map((item) => {
                return {
                    ...item,
                    column: item.name === currentItem.name ? columnName : item.column,
                }

            })
        })
    }

    const ref = useRef(null);

    const [, drop] = useDrop({
        accept: ItemTypes.BLOCK,
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            // Time to actually perform the action
            moveCardHandler(dragIndex, hoverIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.BLOCK,
        item: { name: name},
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            // if (dropResult && dropResult.name === 'Column 1') {
            //     changeItemColumn(item, 'Column 1');
            // } else {
            //     changeItemColumn(item, 'Column 2');
            // }
            if(dropResult) {
                const {name} = dropResult;
                const {ALL_BLOCKS, COLUMN_1, COLUMN_2, GENERAL_COLUMN} = COLUMN_NAMES;
                switch (name) {
                    case ALL_BLOCKS:
                        changeItemColumn(item, ALL_BLOCKS);
                        break;
                    case COLUMN_1:
                        changeItemColumn(item, COLUMN_1);
                        break;
                    case COLUMN_2:
                        changeItemColumn(item, COLUMN_2);
                        break;
                    case GENERAL_COLUMN:
                        changeItemColumn(item, GENERAL_COLUMN);
                        break;
                    default:
                        break;
                }
            }


        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const opacity = isDragging ? 0.4 : 1;

        drag(drop(ref));
    return (
        <div ref={ref} className='movable-item' style={{  opacity }}>
            {name}
        </div>
    )
}

const Column = ({children, className, title}) => {
    const [, drop] = useDrop({
        accept: ItemTypes.BLOCK,
        drop: () => ({ name: title }),
        // collect: (monitor) => ({
        //     isOver: monitor.isOver(),
        //     canDrop: monitor.canDrop(),
        // })
    })

    return (
        <div ref={drop} className={className}>
            {title}
            {children}
        </div>
    )
}

export const App = () => {
    const [items, setItems] = useState(all_blocks);

    const {ALL_BLOCKS, COLUMN_1, COLUMN_2, GENERAL_COLUMN} = COLUMN_NAMES;
    const moveCardHandler = (dragIndex, hoverIndex) => {
        const dragItem = items[dragIndex];

        if(dragItem) {
            setItems((prevState)=>{
                const coppiedStateArray = [...prevState];
                const prevItem = coppiedStateArray.splice(hoverIndex, 1, dragItem);

                coppiedStateArray.splice(dragIndex, 1, prevItem[0]);

                return coppiedStateArray;
            })
        }
    }

    const returnItemsForColumn = (columnName) => {
        return items
            .filter ((item) => item.column === columnName)
            .map((item, index) => (
                <MovableItem
                    key={item.id}
                    name={item.name}
                    setItems={setItems}
                    index={index}
                    moveCardHandler={moveCardHandler}
                />
            ))
    }
    const [isFirstColumn, setFirstColumn] = useState(true);

    const Item = <MovableItem setIsFirstColumn={setFirstColumn} />

    return (
        <div className="container">
            {/* Wrap components that will be "draggable" and "droppable" */}
            <DndProvider backend={HTML5Backend}>
                <div className='table_wrapper'>
                    <div className='table_row'>
                        <Column title={COLUMN_1} className='table_column first-column'>
                            {returnItemsForColumn(COLUMN_1)}
                        </Column>

                        <Column title={COLUMN_2} className='table_column second-column'>
                            {returnItemsForColumn(COLUMN_2)}
                        </Column>
                    </div>
                    <div>
                        <Column title={GENERAL_COLUMN} className='general_column'>
                            {returnItemsForColumn(GENERAL_COLUMN)}
                        </Column>
                    </div>
                </div>


                <Column title={ALL_BLOCKS} className='column second-column'>
                    {returnItemsForColumn(ALL_BLOCKS)}
                </Column>
            </DndProvider>
        </div>
    );
}
export default App;
