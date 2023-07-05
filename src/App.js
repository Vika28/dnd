// @ts-ignore
import React, {useRef} from 'react';
import './App.css';
import {DndProvider, useDrag, useDrop} from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {ItemTypes} from "./ItemTypes";
import {useState} from "react";

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
            if (dropResult && dropResult.name === 'Column 1') {
                changeItemColumn(item, 'Column 1');
            } else {
                changeItemColumn(item, 'Column 2');
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
// const FirstColumn = () => {
//     return (
//         <div className='column first-column'>
//             Column 1
//             <MovableItem/>
//         </div>
//     )
// }

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
    const [items, setItems] = useState([
        {id: 1, name: 'Item 1', column: 'Column 1'},
        {id: 2, name: 'Item 2', column: 'Column 1'},
        {id: 3, name: 'Item 3', column: 'Column 1'},
    ])

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
                <Column title='Column 1' className='column first-column'>
                    {/*{isFirstColumn && Item}*/}
                    {returnItemsForColumn('Column 1')}
                </Column>

                <Column title='Column 2' className='column second-column'>
                    {/*{!isFirstColumn && Item}*/}
                    {returnItemsForColumn('Column 2')}
                </Column>
            </DndProvider>
        </div>
    );
}
export default App;
