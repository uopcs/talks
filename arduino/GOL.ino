// game of life on LED matrix via I2C


#include "Wire.h" // I2C API




int currentArr[8][8]; // this turn
int nextArr[8][8]; // next turn

int threshold;
int count = 0;


void multiplex(int row, int col){
  // get the byte that needs to populate the register
  int aVal = (int) pow(2, col);
  if (col != 0 && col != 1){
    aVal++; // not sure why error is occuring
  }
  int bVal = 255 - pow(2, row);
  setA(aVal);
  setB(bVal);
  //delay(4);
  setupMatrix();
}

void setA(int val){
  Wire.beginTransmission(0x20);
  Wire.write(0x12); // GPIOA
  Wire.write(val); // port A
  Wire.endTransmission();
}

void setB(int val){
   Wire.beginTransmission(0x20);
   Wire.write(0x13); // GPIOB)
   Wire.write(val); // port B
   Wire.endTransmission();
}

int countNeighbors(int i, int j){
  int neighbors = 0;
  for (int k = -1; k <= 1; k++){
    for (int m = -1; m <= 1; m++){
      if (k == 0 && m == k){
        continue;
      }
      else if (i + k < 0){
        neighbors+=currentArr[7][j + m]; // i + k = 7
      }
      else if (j + m < 0){
        neighbors+=currentArr[i + k][7]; // j + m = 7
      }
      else if (i + k > 7){
        neighbors+=currentArr[0][j + m]; // i + k = 0
      }
      else if (j + m > 7){
        neighbors+=currentArr[i + k][0]; // j + m = 0
      } 
      else {
        neighbors+=currentArr[i + k][j + m];
      }
    }
  }
  return neighbors;
}

void nextTurn(){
  int neighbors = 0;
  for (int i = 0; i < 8; i++){
    for (int j = 0; j < 8; j++){
      neighbors = countNeighbors(i, j);
      if (currentArr[i][j] == 1){
        // cell is populated
        if (neighbors == 2 || neighbors == 3){
          nextArr[i][j] = 1;
        } else {
          nextArr[i][j] = 0;
        }
      } else {
        // cell is empty
        if (neighbors == 3){
          nextArr[i][j] = 1;
        } else {
          nextArr[i][j] = 0;
        }
      }
    }
  }
  for (int i = 0; i < 8; i++){
   for (int j = 0; j < 8; j++){
     currentArr[i][j] = nextArr[i][j];
   }
  } 
}

void updateMatrix(){
  for (int i = 0; i < 8; i++){
    for (int j = 0; j < 8; j++){
      if (currentArr[i][j] == 1){
        multiplex(i, j);
      }
    }
  }
}

void setupMatrix()
{
  setA(0x00);
  setB(0xFF);
}

void initCurrent(){
  for (int i = 0; i < 8; i++){
    for (int j = 0; j < 8; j++){
      int lifeRand = random(100);
      if (lifeRand < threshold){
        currentArr[i][j] = 1;
      } else {
        currentArr[i][j] = 0;
      }
    }
  }
}

// port A = VCC/COLS
// port B = GND/ROWS
void setup()
{
  Serial.begin(9800);
  randomSeed(analogRead(0)); // init random number generator, 
  //analogRead(0) is as close to a true RN were goign to get!
  Wire.begin(); // wake up I2C bus
  // set I/O pins to outputs
  Wire.beginTransmission(0x20);
  Wire.write(0x00); // IODIRA register
  Wire.write(0x00); // set all of port A to outputs
  Wire.endTransmission();
  Wire.beginTransmission(0x20);
  Wire.write(0x01); // IODIRB register
  Wire.write(0x00); // set all of port B to outputs
  Wire.endTransmission();
  threshold = random(80); // threshold% of initial grid will be 1
  setupMatrix();
  initCurrent();
  
  
}

void loop(){
  int spd = (int)analogRead(A1) / 50;
  updateMatrix(); // update the LED matrix with new data
  if (count % (spd + 1) == 0){
    nextTurn(); // update state
  }
  //delay(analogRead(A1) / 10);
  count++;
}
