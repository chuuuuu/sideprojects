#include <bits/stdc++.h>
using namespace std;

void f(string* s){
  (*s)[0] = 'a';
}

int main() {
	ios::sync_with_stdio(0);
  cin.tie(0);
  
  string s;
  s = "1234";
  cout << s << endl;

  int n = stoi(s);
  cout << n <<endl;

  string* s_ptr = &s;
  cout << (*s_ptr)[0] << endl;

  f(s_ptr);
  cout << s << endl;

  string a = "1234";
  string b = "2234";
  string c = "12345";
  string d = "543";

  cout << "b > a: " << (b > a) << endl;
  cout << "b > c: " << (b > c) << endl;
  cout << "c > a: " << (c > a) << endl;
  cout << "d > a: " << (d > a) << endl;
}