// Adapted from: https://github.com/awesomejerry/react-native-qrcode-svg

import { Box, Image } from 'native-base';
import QRCodeUtil from 'qrcode';
import React, { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, Rect } from 'react-native-svg';

const generateMatrix = (value, errorCorrectionLevel) => {
  const arr = Array.prototype.slice.call(
    QRCodeUtil.create(value, { errorCorrectionLevel }).modules.data,
    0
  );
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0
        ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows,
    []
  );
};

export const QRCode = (props) => {
  const {
    ecl = 'Q',
    avatarSource,
    logoMargin = -5,
    logoSize = 66,
    size = 250,
    value = 'QR Code',
  } = props;

  const dotElements = useMemo(() => {
    const dots = [];
    const matrix = generateMatrix(value, ecl);
    const cellSize = size / matrix.length;
    const qrList = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];

    qrList.forEach(({ x, y }, index) => {
      const x1 = (matrix.length - 7) * cellSize * x;
      const y1 = (matrix.length - 7) * cellSize * y;
      for (let i = 0; i < 3; i++) {
        // eyes
        dots.push(
          <Rect
            fill={i === 0 ? 'black' : i === 1 ? 'white' : 'black'} // color values = outer ring, inner ring, center dot
            height={cellSize * (7 - i * 2)}
            rx={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
            ry={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
            width={cellSize * (7 - i * 2)}
            x={x1 + cellSize * i}
            y={y1 + cellSize * i}
            key={`${index}-${i}`} // eslint-disable-line react/no-array-index-key
          />
        );
      }
    });

    const clearArenaSize = Math.floor((logoSize + 30) / cellSize);
    const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2.5;
    const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2.5 - 1;

    matrix.forEach((row, i) => {
      row.forEach((column, j) => {
        if (matrix[i][j]) {
          if (
            !(
              (i < 7 && j < 7) ||
              (i > matrix.length - 8 && j < 7) ||
              (i < 7 && j > matrix.length - 8)
            )
          ) {
            if (
              !(
                i > matrixMiddleStart &&
                i < matrixMiddleEnd &&
                j > matrixMiddleStart &&
                j < matrixMiddleEnd &&
                i < j + clearArenaSize / 2 &&
                j < i + clearArenaSize / 2 + 1
              )
            ) {
              dots.push(
                <Circle
                  cx={i * cellSize + cellSize / 2}
                  cy={j * cellSize + cellSize / 2}
                  fill='black'
                  r={cellSize / 3.6} // calculate size of single dots
                  key={`${i}-${j}`} // eslint-disable-line react/no-array-index-key
                />
              );
            }
          }
        }
      });
    });

    return dots;
  }, [ecl, logoSize, size, value]);

  const logoPosition = size / 2 - logoSize / 2 - logoMargin;
  const logoWrapperSize = logoSize + logoMargin * 2;

  return (
    <Box>
      <Svg height={size} width={size}>
        <Defs>
          <ClipPath id='clip-wrapper'>
            <Circle
              cx={logoWrapperSize / 2}
              cy={logoWrapperSize / 2}
              r={logoWrapperSize / 2}
            />
          </ClipPath>
          <ClipPath id='clip-logo'>
            <Circle cx={logoSize / 2} cy={logoSize / 2} r={logoSize / 2} />
          </ClipPath>
        </Defs>
        <Rect fill='white' height={size} width={size} />
        {dotElements}
      </Svg>
      {avatarSource && (
        <Image
          style={{
            zIndex: 2,
            position: 'absolute',
            left: logoPosition + logoMargin,
            top: logoPosition + logoMargin,
            height: logoSize,
            width: logoSize,
            borderRadius: logoSize / 2,
          }}
          source={avatarSource}
        />
      )}
    </Box>
  );
};
