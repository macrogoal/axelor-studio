import { IconButton, InputAdornment, OutlinedInput } from "@material-ui/core"
import { useState } from "react"
import { makeStyles } from "@material-ui/core"
import { Box, Input, InputLabel } from "@axelor/ui"
import { MaterialIcon } from "@axelor/ui/icons/material-icon"

const useStyle = makeStyles({
  root: {
    width: "10ch",
    color: "currentColor",
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": {
      display: "none",
    },
    "& input[type=number]": {
      MozAppearance: "textfield",
    },
    "& input": {
      textAlign: "center",
    },
    "& .MuiInputAdornment-root": {
      display: "none",
    },
    "&:hover .MuiInputAdornment-root, & input:focus + .MuiInputAdornment-root": {
      display: "flex",
    },
    "&:hover, &:focus-within": {
      paddingRight: 0,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--bs-border-color) !important",
    },
  },
})

const roundToTwoDecimalPlace = value => {
  const n = 2
  return Math.round(value * 10 ** n) / 10 ** n
}

const restrictToTwoDecimalPlace = value => {
  const n = 2
  return Math.trunc(value * 10 ** n) / 10 ** n
}

function isLeftClick(event) {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
    return false
  } else if ("buttons" in event) {
    return event.buttons === 1
  } else if ("which" in event) {
    return event.which === 1
  } else {
    return event.button === 1 || event.type === "click"
  }
}

function Tile({ label, onChange, value, name, integer, allowNegetiveOne }) {
  const [timerId, setTimerId] = useState(null)
  const [isFocused, setIsFocused] = useState(false)
  const classes = useStyle()
  const increment = () => {
    onChange(value => ({ ...value, [name]: (value[name] || 0) + 1 }))
  }

  const decrement = () => {
    onChange(value =>
      value[name] > 0
        ? value[name] > 1
          ? {
              ...value,
              [name]: roundToTwoDecimalPlace(value[name] - 1),
            }
          : {
              ...value,
              [name]: 0,
            }
        : allowNegetiveOne
        ? {
            ...value,
            [name]: -1,
          }
        : value
    )
  }

  const handleMouseDown = event => {
    event.preventDefault() // To prevent input from losing focus
  }

  const startTimer = (delay, interval, fn) => {
    setTimerId(
      setTimeout(() => {
        setTimerId(
          setInterval(() => {
            fn()
          }, interval)
        )
        fn()
      }, delay)
    )
  }

  const clearTimer = () => {
    clearInterval(timerId) //clearInterval/clearTimeout can be used interchangebly
  }

  const handleChange = e => {
    onChange({
      ...value,
      [name]:
        e.target.value >= 0
          ? integer
            ? parseInt(e.target.value || 0)
            : restrictToTwoDecimalPlace(parseFloat(e.target.value))
          : allowNegetiveOne
          ? -1
          : 0,
    })
  }

  const handleWheel = e => {
    e.deltaY > 0 ? decrement() : increment()
  }

  return (
    <Box d="flex" flexDirection="column" alignItems="center" gap="0.5rem">
      {/* <OutlinedInput
        className={classes.root}
        type="number"
        id={label}
        value={isFocused ? value[name] || "" : value[name] || 0}
        onChange={handleChange}
        onWheel={handleWheel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        endAdornment={
          <InputAdornment position="end">
            <Box d="flex" flexDirection="column" onMouseDown={handleMouseDown}>
              <IconButton
                tabIndex={-1}
                onClick={increment}
                onMouseDown={e =>
                  isLeftClick(e) && startTimer(500, 75, increment)
                }
                onMouseUp={clearTimer}
                size="small"
              >
                <MaterialIcon
                  icon="keyboard_arrow_up"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
              <IconButton
                tabIndex={-1}
                onClick={decrement}
                size="small"
                onMouseDown={e =>
                  isLeftClick(e) && startTimer(500, 75, decrement)
                }
                onMouseUp={clearTimer}
              >
                <MaterialIcon
                  icon="keyboard_arrow_down"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
            </Box>
          </InputAdornment>
        }
      /> */}
      <Input
        className={classes.root}
        type="number"
        id={label}
        value={isFocused ? value[name] || "" : value[name] || 0}
        onChange={handleChange}
        onWheel={handleWheel}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        endAdornment={
          <InputAdornment position="end">
            <Box d="flex" flexDirection="column" onMouseDown={handleMouseDown}>
              <IconButton
                tabIndex={-1}
                onClick={increment}
                onMouseDown={e =>
                  isLeftClick(e) && startTimer(500, 75, increment)
                }
                onMouseUp={clearTimer}
                size="small"
              >
                <MaterialIcon
                  icon="keyboard_arrow_up"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
              <IconButton
                tabIndex={-1}
                onClick={decrement}
                size="small"
                onMouseDown={
                  e => isLeftClick(e) && startTimer(500, 75, decrement)
                  /* 
                    start timer only on left mousedown, 
                    on rightClick, mousedown event fires but not mouseup
                     */
                }
                onMouseUp={clearTimer}
              >
                <MaterialIcon
                  icon="keyboard_arrow_down"
                  fontSize="small"
                  color="body"
                />
              </IconButton>
            </Box>
          </InputAdornment>
        }
      />
      <InputLabel htmlFor={label}>{label}</InputLabel>
    </Box>
  )
}

export default Tile
