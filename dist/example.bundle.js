(function () {
	'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var runtime_1 = createCommonjsModule(function (module) {
	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var runtime = (function (exports) {

	  var Op = Object.prototype;
	  var hasOwn = Op.hasOwnProperty;
	  var undefined$1; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

	  function define(obj, key, value) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	    return obj[key];
	  }
	  try {
	    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
	    define({}, "");
	  } catch (err) {
	    define = function(obj, key, value) {
	      return obj[key] = value;
	    };
	  }

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	    var generator = Object.create(protoGenerator.prototype);
	    var context = new Context(tryLocsList || []);

	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);

	    return generator;
	  }
	  exports.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  // This is a polyfill for %IteratorPrototype% for environments that
	  // don't natively support it.
	  var IteratorPrototype = {};
	  IteratorPrototype[iteratorSymbol] = function () {
	    return this;
	  };

	  var getProto = Object.getPrototypeOf;
	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  if (NativeIteratorPrototype &&
	      NativeIteratorPrototype !== Op &&
	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	    // This environment has a native %IteratorPrototype%; use it instead
	    // of the polyfill.
	    IteratorPrototype = NativeIteratorPrototype;
	  }

	  var Gp = GeneratorFunctionPrototype.prototype =
	    Generator.prototype = Object.create(IteratorPrototype);
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunction.displayName = define(
	    GeneratorFunctionPrototype,
	    toStringTagSymbol,
	    "GeneratorFunction"
	  );

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      define(prototype, method, function(arg) {
	        return this._invoke(method, arg);
	      });
	    });
	  }

	  exports.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };

	  exports.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      define(genFun, toStringTagSymbol, "GeneratorFunction");
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
	  // meant to be awaited.
	  exports.awrap = function(arg) {
	    return { __await: arg };
	  };

	  function AsyncIterator(generator, PromiseImpl) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value &&
	            typeof value === "object" &&
	            hasOwn.call(value, "__await")) {
	          return PromiseImpl.resolve(value.__await).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }

	        return PromiseImpl.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration.
	          result.value = unwrapped;
	          resolve(result);
	        }, function(error) {
	          // If a rejected Promise was yielded, throw the rejection back
	          // into the async generator function so it can be handled there.
	          return invoke("throw", error, resolve, reject);
	        });
	      }
	    }

	    var previousPromise;

	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new PromiseImpl(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }

	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);
	  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
	    return this;
	  };
	  exports.AsyncIterator = AsyncIterator;

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
	    if (PromiseImpl === void 0) PromiseImpl = Promise;

	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList),
	      PromiseImpl
	    );

	    return exports.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      context.method = method;
	      context.arg = arg;

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          var delegateResult = maybeInvokeDelegate(delegate, context);
	          if (delegateResult) {
	            if (delegateResult === ContinueSentinel) continue;
	            return delegateResult;
	          }
	        }

	        if (context.method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = context.arg;

	        } else if (context.method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw context.arg;
	          }

	          context.dispatchException(context.arg);

	        } else if (context.method === "return") {
	          context.abrupt("return", context.arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;

	          if (record.arg === ContinueSentinel) {
	            continue;
	          }

	          return {
	            value: record.arg,
	            done: context.done
	          };

	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(context.arg) call above.
	          context.method = "throw";
	          context.arg = record.arg;
	        }
	      }
	    };
	  }

	  // Call delegate.iterator[context.method](context.arg) and handle the
	  // result, either by returning a { value, done } result from the
	  // delegate iterator, or by modifying context.method and context.arg,
	  // setting context.delegate to null, and returning the ContinueSentinel.
	  function maybeInvokeDelegate(delegate, context) {
	    var method = delegate.iterator[context.method];
	    if (method === undefined$1) {
	      // A .throw or .return when the delegate iterator has no .throw
	      // method always terminates the yield* loop.
	      context.delegate = null;

	      if (context.method === "throw") {
	        // Note: ["return"] must be used for ES3 parsing compatibility.
	        if (delegate.iterator["return"]) {
	          // If the delegate iterator has a return method, give it a
	          // chance to clean up.
	          context.method = "return";
	          context.arg = undefined$1;
	          maybeInvokeDelegate(delegate, context);

	          if (context.method === "throw") {
	            // If maybeInvokeDelegate(context) changed context.method from
	            // "return" to "throw", let that override the TypeError below.
	            return ContinueSentinel;
	          }
	        }

	        context.method = "throw";
	        context.arg = new TypeError(
	          "The iterator does not provide a 'throw' method");
	      }

	      return ContinueSentinel;
	    }

	    var record = tryCatch(method, delegate.iterator, context.arg);

	    if (record.type === "throw") {
	      context.method = "throw";
	      context.arg = record.arg;
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    var info = record.arg;

	    if (! info) {
	      context.method = "throw";
	      context.arg = new TypeError("iterator result is not an object");
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    if (info.done) {
	      // Assign the result of the finished delegate to the temporary
	      // variable specified by delegate.resultName (see delegateYield).
	      context[delegate.resultName] = info.value;

	      // Resume execution at the desired location (see delegateYield).
	      context.next = delegate.nextLoc;

	      // If context.method was "throw" but the delegate handled the
	      // exception, let the outer generator proceed normally. If
	      // context.method was "next", forget context.arg since it has been
	      // "consumed" by the delegate iterator. If context.method was
	      // "return", allow the original .return call to continue in the
	      // outer generator.
	      if (context.method !== "return") {
	        context.method = "next";
	        context.arg = undefined$1;
	      }

	    } else {
	      // Re-yield the result returned by the delegate method.
	      return info;
	    }

	    // The delegate iterator is finished, so forget it and continue with
	    // the outer generator.
	    context.delegate = null;
	    return ContinueSentinel;
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  define(Gp, toStringTagSymbol, "Generator");

	  // A Generator should always return itself as the iterator object when the
	  // @@iterator function is called on it. Some browsers' implementations of the
	  // iterator prototype chain incorrectly implement this, causing the Generator
	  // object to not be returned from this call. This ensures that doesn't happen.
	  // See https://github.com/facebook/regenerator/issues/274 for more details.
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };

	  Gp.toString = function() {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  exports.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined$1;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  exports.values = values;

	  function doneResult() {
	    return { value: undefined$1, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined$1;
	      this.done = false;
	      this.delegate = null;

	      this.method = "next";
	      this.arg = undefined$1;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined$1;
	          }
	        }
	      }
	    },

	    stop: function() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;

	        if (caught) {
	          // If the dispatched exception was caught by a catch block,
	          // then let that catch block handle the exception normally.
	          context.method = "next";
	          context.arg = undefined$1;
	        }

	        return !! caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }

	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.method = "next";
	        this.next = finallyEntry.finallyLoc;
	        return ContinueSentinel;
	      }

	      return this.complete(record);
	    },

	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = this.arg = record.arg;
	        this.method = "return";
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }

	      return ContinueSentinel;
	    },

	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      if (this.method === "next") {
	        // Deliberately forget the last sent value so that we don't
	        // accidentally pass it on to the delegate.
	        this.arg = undefined$1;
	      }

	      return ContinueSentinel;
	    }
	  };

	  // Regardless of whether this script is executing as a CommonJS module
	  // or not, return the runtime object so that we can declare the variable
	  // regeneratorRuntime in the outer scope, which allows this module to be
	  // injected easily by `bin/regenerator --include-runtime script.js`.
	  return exports;

	}(
	  // If this script is executing as a CommonJS module, use module.exports
	  // as the regeneratorRuntime namespace. Otherwise create a new empty
	  // object. Either way, the resulting object will be used to initialize
	  // the regeneratorRuntime variable at the top of this file.
	   module.exports 
	));

	try {
	  regeneratorRuntime = runtime;
	} catch (accidentalStrictMode) {
	  // This module should not be running in strict mode, so the above
	  // assignment should always work unless something is misconfigured. Just
	  // in case runtime.js accidentally runs in strict mode, we can escape
	  // strict mode using a global Function call. This could conceivably fail
	  // if a Content Security Policy forbids using Function, but in that case
	  // the proper solution is to fix the accidental strict mode problem. If
	  // you've misconfigured your bundler to force strict mode and applied a
	  // CSP to forbid Function, and you're not willing to fix either of those
	  // problems, please detail your unique predicament in a GitHub issue.
	  Function("r", "regeneratorRuntime = r")(runtime);
	}
	});

	var regenerator = runtime_1;

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  return Constructor;
	}

	var createClass = _createClass;

	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return self;
	}

	var assertThisInitialized = _assertThisInitialized;

	function _inheritsLoose(subClass, superClass) {
	  subClass.prototype = Object.create(superClass.prototype);
	  subClass.prototype.constructor = subClass;
	  subClass.__proto__ = superClass;
	}

	var inheritsLoose = _inheritsLoose;

	/**
	 * @author Toru Nagashima <https://github.com/mysticatea>
	 * @copyright 2015 Toru Nagashima. All rights reserved.
	 * See LICENSE file in root directory for full license.
	 */
	/**
	 * @typedef {object} PrivateData
	 * @property {EventTarget} eventTarget The event target.
	 * @property {{type:string}} event The original event object.
	 * @property {number} eventPhase The current event phase.
	 * @property {EventTarget|null} currentTarget The current event target.
	 * @property {boolean} canceled The flag to prevent default.
	 * @property {boolean} stopped The flag to stop propagation.
	 * @property {boolean} immediateStopped The flag to stop propagation immediately.
	 * @property {Function|null} passiveListener The listener if the current listener is passive. Otherwise this is null.
	 * @property {number} timeStamp The unix time.
	 * @private
	 */

	/**
	 * Private data for event wrappers.
	 * @type {WeakMap<Event, PrivateData>}
	 * @private
	 */
	const privateData = new WeakMap();

	/**
	 * Cache for wrapper classes.
	 * @type {WeakMap<Object, Function>}
	 * @private
	 */
	const wrappers = new WeakMap();

	/**
	 * Get private data.
	 * @param {Event} event The event object to get private data.
	 * @returns {PrivateData} The private data of the event.
	 * @private
	 */
	function pd(event) {
	    const retv = privateData.get(event);
	    console.assert(
	        retv != null,
	        "'this' is expected an Event object, but got",
	        event
	    );
	    return retv
	}

	/**
	 * https://dom.spec.whatwg.org/#set-the-canceled-flag
	 * @param data {PrivateData} private data.
	 */
	function setCancelFlag(data) {
	    if (data.passiveListener != null) {
	        if (
	            typeof console !== "undefined" &&
	            typeof console.error === "function"
	        ) {
	            console.error(
	                "Unable to preventDefault inside passive event listener invocation.",
	                data.passiveListener
	            );
	        }
	        return
	    }
	    if (!data.event.cancelable) {
	        return
	    }

	    data.canceled = true;
	    if (typeof data.event.preventDefault === "function") {
	        data.event.preventDefault();
	    }
	}

	/**
	 * @see https://dom.spec.whatwg.org/#interface-event
	 * @private
	 */
	/**
	 * The event wrapper.
	 * @constructor
	 * @param {EventTarget} eventTarget The event target of this dispatching.
	 * @param {Event|{type:string}} event The original event to wrap.
	 */
	function Event(eventTarget, event) {
	    privateData.set(this, {
	        eventTarget,
	        event,
	        eventPhase: 2,
	        currentTarget: eventTarget,
	        canceled: false,
	        stopped: false,
	        immediateStopped: false,
	        passiveListener: null,
	        timeStamp: event.timeStamp || Date.now(),
	    });

	    // https://heycam.github.io/webidl/#Unforgeable
	    Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });

	    // Define accessors
	    const keys = Object.keys(event);
	    for (let i = 0; i < keys.length; ++i) {
	        const key = keys[i];
	        if (!(key in this)) {
	            Object.defineProperty(this, key, defineRedirectDescriptor(key));
	        }
	    }
	}

	// Should be enumerable, but class methods are not enumerable.
	Event.prototype = {
	    /**
	     * The type of this event.
	     * @type {string}
	     */
	    get type() {
	        return pd(this).event.type
	    },

	    /**
	     * The target of this event.
	     * @type {EventTarget}
	     */
	    get target() {
	        return pd(this).eventTarget
	    },

	    /**
	     * The target of this event.
	     * @type {EventTarget}
	     */
	    get currentTarget() {
	        return pd(this).currentTarget
	    },

	    /**
	     * @returns {EventTarget[]} The composed path of this event.
	     */
	    composedPath() {
	        const currentTarget = pd(this).currentTarget;
	        if (currentTarget == null) {
	            return []
	        }
	        return [currentTarget]
	    },

	    /**
	     * Constant of NONE.
	     * @type {number}
	     */
	    get NONE() {
	        return 0
	    },

	    /**
	     * Constant of CAPTURING_PHASE.
	     * @type {number}
	     */
	    get CAPTURING_PHASE() {
	        return 1
	    },

	    /**
	     * Constant of AT_TARGET.
	     * @type {number}
	     */
	    get AT_TARGET() {
	        return 2
	    },

	    /**
	     * Constant of BUBBLING_PHASE.
	     * @type {number}
	     */
	    get BUBBLING_PHASE() {
	        return 3
	    },

	    /**
	     * The target of this event.
	     * @type {number}
	     */
	    get eventPhase() {
	        return pd(this).eventPhase
	    },

	    /**
	     * Stop event bubbling.
	     * @returns {void}
	     */
	    stopPropagation() {
	        const data = pd(this);

	        data.stopped = true;
	        if (typeof data.event.stopPropagation === "function") {
	            data.event.stopPropagation();
	        }
	    },

	    /**
	     * Stop event bubbling.
	     * @returns {void}
	     */
	    stopImmediatePropagation() {
	        const data = pd(this);

	        data.stopped = true;
	        data.immediateStopped = true;
	        if (typeof data.event.stopImmediatePropagation === "function") {
	            data.event.stopImmediatePropagation();
	        }
	    },

	    /**
	     * The flag to be bubbling.
	     * @type {boolean}
	     */
	    get bubbles() {
	        return Boolean(pd(this).event.bubbles)
	    },

	    /**
	     * The flag to be cancelable.
	     * @type {boolean}
	     */
	    get cancelable() {
	        return Boolean(pd(this).event.cancelable)
	    },

	    /**
	     * Cancel this event.
	     * @returns {void}
	     */
	    preventDefault() {
	        setCancelFlag(pd(this));
	    },

	    /**
	     * The flag to indicate cancellation state.
	     * @type {boolean}
	     */
	    get defaultPrevented() {
	        return pd(this).canceled
	    },

	    /**
	     * The flag to be composed.
	     * @type {boolean}
	     */
	    get composed() {
	        return Boolean(pd(this).event.composed)
	    },

	    /**
	     * The unix time of this event.
	     * @type {number}
	     */
	    get timeStamp() {
	        return pd(this).timeStamp
	    },

	    /**
	     * The target of this event.
	     * @type {EventTarget}
	     * @deprecated
	     */
	    get srcElement() {
	        return pd(this).eventTarget
	    },

	    /**
	     * The flag to stop event bubbling.
	     * @type {boolean}
	     * @deprecated
	     */
	    get cancelBubble() {
	        return pd(this).stopped
	    },
	    set cancelBubble(value) {
	        if (!value) {
	            return
	        }
	        const data = pd(this);

	        data.stopped = true;
	        if (typeof data.event.cancelBubble === "boolean") {
	            data.event.cancelBubble = true;
	        }
	    },

	    /**
	     * The flag to indicate cancellation state.
	     * @type {boolean}
	     * @deprecated
	     */
	    get returnValue() {
	        return !pd(this).canceled
	    },
	    set returnValue(value) {
	        if (!value) {
	            setCancelFlag(pd(this));
	        }
	    },

	    /**
	     * Initialize this event object. But do nothing under event dispatching.
	     * @param {string} type The event type.
	     * @param {boolean} [bubbles=false] The flag to be possible to bubble up.
	     * @param {boolean} [cancelable=false] The flag to be possible to cancel.
	     * @deprecated
	     */
	    initEvent() {
	        // Do nothing.
	    },
	};

	// `constructor` is not enumerable.
	Object.defineProperty(Event.prototype, "constructor", {
	    value: Event,
	    configurable: true,
	    writable: true,
	});

	// Ensure `event instanceof window.Event` is `true`.
	if (typeof window !== "undefined" && typeof window.Event !== "undefined") {
	    Object.setPrototypeOf(Event.prototype, window.Event.prototype);

	    // Make association for wrappers.
	    wrappers.set(window.Event.prototype, Event);
	}

	/**
	 * Get the property descriptor to redirect a given property.
	 * @param {string} key Property name to define property descriptor.
	 * @returns {PropertyDescriptor} The property descriptor to redirect the property.
	 * @private
	 */
	function defineRedirectDescriptor(key) {
	    return {
	        get() {
	            return pd(this).event[key]
	        },
	        set(value) {
	            pd(this).event[key] = value;
	        },
	        configurable: true,
	        enumerable: true,
	    }
	}

	/**
	 * Get the property descriptor to call a given method property.
	 * @param {string} key Property name to define property descriptor.
	 * @returns {PropertyDescriptor} The property descriptor to call the method property.
	 * @private
	 */
	function defineCallDescriptor(key) {
	    return {
	        value() {
	            const event = pd(this).event;
	            return event[key].apply(event, arguments)
	        },
	        configurable: true,
	        enumerable: true,
	    }
	}

	/**
	 * Define new wrapper class.
	 * @param {Function} BaseEvent The base wrapper class.
	 * @param {Object} proto The prototype of the original event.
	 * @returns {Function} The defined wrapper class.
	 * @private
	 */
	function defineWrapper(BaseEvent, proto) {
	    const keys = Object.keys(proto);
	    if (keys.length === 0) {
	        return BaseEvent
	    }

	    /** CustomEvent */
	    function CustomEvent(eventTarget, event) {
	        BaseEvent.call(this, eventTarget, event);
	    }

	    CustomEvent.prototype = Object.create(BaseEvent.prototype, {
	        constructor: { value: CustomEvent, configurable: true, writable: true },
	    });

	    // Define accessors.
	    for (let i = 0; i < keys.length; ++i) {
	        const key = keys[i];
	        if (!(key in BaseEvent.prototype)) {
	            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
	            const isFunc = typeof descriptor.value === "function";
	            Object.defineProperty(
	                CustomEvent.prototype,
	                key,
	                isFunc
	                    ? defineCallDescriptor(key)
	                    : defineRedirectDescriptor(key)
	            );
	        }
	    }

	    return CustomEvent
	}

	/**
	 * Get the wrapper class of a given prototype.
	 * @param {Object} proto The prototype of the original event to get its wrapper.
	 * @returns {Function} The wrapper class.
	 * @private
	 */
	function getWrapper(proto) {
	    if (proto == null || proto === Object.prototype) {
	        return Event
	    }

	    let wrapper = wrappers.get(proto);
	    if (wrapper == null) {
	        wrapper = defineWrapper(getWrapper(Object.getPrototypeOf(proto)), proto);
	        wrappers.set(proto, wrapper);
	    }
	    return wrapper
	}

	/**
	 * Wrap a given event to management a dispatching.
	 * @param {EventTarget} eventTarget The event target of this dispatching.
	 * @param {Object} event The event to wrap.
	 * @returns {Event} The wrapper instance.
	 * @private
	 */
	function wrapEvent(eventTarget, event) {
	    const Wrapper = getWrapper(Object.getPrototypeOf(event));
	    return new Wrapper(eventTarget, event)
	}

	/**
	 * Get the immediateStopped flag of a given event.
	 * @param {Event} event The event to get.
	 * @returns {boolean} The flag to stop propagation immediately.
	 * @private
	 */
	function isStopped(event) {
	    return pd(event).immediateStopped
	}

	/**
	 * Set the current event phase of a given event.
	 * @param {Event} event The event to set current target.
	 * @param {number} eventPhase New event phase.
	 * @returns {void}
	 * @private
	 */
	function setEventPhase(event, eventPhase) {
	    pd(event).eventPhase = eventPhase;
	}

	/**
	 * Set the current target of a given event.
	 * @param {Event} event The event to set current target.
	 * @param {EventTarget|null} currentTarget New current target.
	 * @returns {void}
	 * @private
	 */
	function setCurrentTarget(event, currentTarget) {
	    pd(event).currentTarget = currentTarget;
	}

	/**
	 * Set a passive listener of a given event.
	 * @param {Event} event The event to set current target.
	 * @param {Function|null} passiveListener New passive listener.
	 * @returns {void}
	 * @private
	 */
	function setPassiveListener(event, passiveListener) {
	    pd(event).passiveListener = passiveListener;
	}

	/**
	 * @typedef {object} ListenerNode
	 * @property {Function} listener
	 * @property {1|2|3} listenerType
	 * @property {boolean} passive
	 * @property {boolean} once
	 * @property {ListenerNode|null} next
	 * @private
	 */

	/**
	 * @type {WeakMap<object, Map<string, ListenerNode>>}
	 * @private
	 */
	const listenersMap = new WeakMap();

	// Listener types
	const CAPTURE = 1;
	const BUBBLE = 2;
	const ATTRIBUTE = 3;

	/**
	 * Check whether a given value is an object or not.
	 * @param {any} x The value to check.
	 * @returns {boolean} `true` if the value is an object.
	 */
	function isObject(x) {
	    return x !== null && typeof x === "object" //eslint-disable-line no-restricted-syntax
	}

	/**
	 * Get listeners.
	 * @param {EventTarget} eventTarget The event target to get.
	 * @returns {Map<string, ListenerNode>} The listeners.
	 * @private
	 */
	function getListeners(eventTarget) {
	    const listeners = listenersMap.get(eventTarget);
	    if (listeners == null) {
	        throw new TypeError(
	            "'this' is expected an EventTarget object, but got another value."
	        )
	    }
	    return listeners
	}

	/**
	 * Get the property descriptor for the event attribute of a given event.
	 * @param {string} eventName The event name to get property descriptor.
	 * @returns {PropertyDescriptor} The property descriptor.
	 * @private
	 */
	function defineEventAttributeDescriptor(eventName) {
	    return {
	        get() {
	            const listeners = getListeners(this);
	            let node = listeners.get(eventName);
	            while (node != null) {
	                if (node.listenerType === ATTRIBUTE) {
	                    return node.listener
	                }
	                node = node.next;
	            }
	            return null
	        },

	        set(listener) {
	            if (typeof listener !== "function" && !isObject(listener)) {
	                listener = null; // eslint-disable-line no-param-reassign
	            }
	            const listeners = getListeners(this);

	            // Traverse to the tail while removing old value.
	            let prev = null;
	            let node = listeners.get(eventName);
	            while (node != null) {
	                if (node.listenerType === ATTRIBUTE) {
	                    // Remove old value.
	                    if (prev !== null) {
	                        prev.next = node.next;
	                    } else if (node.next !== null) {
	                        listeners.set(eventName, node.next);
	                    } else {
	                        listeners.delete(eventName);
	                    }
	                } else {
	                    prev = node;
	                }

	                node = node.next;
	            }

	            // Add new value.
	            if (listener !== null) {
	                const newNode = {
	                    listener,
	                    listenerType: ATTRIBUTE,
	                    passive: false,
	                    once: false,
	                    next: null,
	                };
	                if (prev === null) {
	                    listeners.set(eventName, newNode);
	                } else {
	                    prev.next = newNode;
	                }
	            }
	        },
	        configurable: true,
	        enumerable: true,
	    }
	}

	/**
	 * Define an event attribute (e.g. `eventTarget.onclick`).
	 * @param {Object} eventTargetPrototype The event target prototype to define an event attrbite.
	 * @param {string} eventName The event name to define.
	 * @returns {void}
	 */
	function defineEventAttribute(eventTargetPrototype, eventName) {
	    Object.defineProperty(
	        eventTargetPrototype,
	        `on${eventName}`,
	        defineEventAttributeDescriptor(eventName)
	    );
	}

	/**
	 * Define a custom EventTarget with event attributes.
	 * @param {string[]} eventNames Event names for event attributes.
	 * @returns {EventTarget} The custom EventTarget.
	 * @private
	 */
	function defineCustomEventTarget(eventNames) {
	    /** CustomEventTarget */
	    function CustomEventTarget() {
	        EventTarget.call(this);
	    }

	    CustomEventTarget.prototype = Object.create(EventTarget.prototype, {
	        constructor: {
	            value: CustomEventTarget,
	            configurable: true,
	            writable: true,
	        },
	    });

	    for (let i = 0; i < eventNames.length; ++i) {
	        defineEventAttribute(CustomEventTarget.prototype, eventNames[i]);
	    }

	    return CustomEventTarget
	}

	/**
	 * EventTarget.
	 *
	 * - This is constructor if no arguments.
	 * - This is a function which returns a CustomEventTarget constructor if there are arguments.
	 *
	 * For example:
	 *
	 *     class A extends EventTarget {}
	 *     class B extends EventTarget("message") {}
	 *     class C extends EventTarget("message", "error") {}
	 *     class D extends EventTarget(["message", "error"]) {}
	 */
	function EventTarget() {
	    /*eslint-disable consistent-return */
	    if (this instanceof EventTarget) {
	        listenersMap.set(this, new Map());
	        return
	    }
	    if (arguments.length === 1 && Array.isArray(arguments[0])) {
	        return defineCustomEventTarget(arguments[0])
	    }
	    if (arguments.length > 0) {
	        const types = new Array(arguments.length);
	        for (let i = 0; i < arguments.length; ++i) {
	            types[i] = arguments[i];
	        }
	        return defineCustomEventTarget(types)
	    }
	    throw new TypeError("Cannot call a class as a function")
	    /*eslint-enable consistent-return */
	}

	// Should be enumerable, but class methods are not enumerable.
	EventTarget.prototype = {
	    /**
	     * Add a given listener to this event target.
	     * @param {string} eventName The event name to add.
	     * @param {Function} listener The listener to add.
	     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
	     * @returns {void}
	     */
	    addEventListener(eventName, listener, options) {
	        if (listener == null) {
	            return
	        }
	        if (typeof listener !== "function" && !isObject(listener)) {
	            throw new TypeError("'listener' should be a function or an object.")
	        }

	        const listeners = getListeners(this);
	        const optionsIsObj = isObject(options);
	        const capture = optionsIsObj
	            ? Boolean(options.capture)
	            : Boolean(options);
	        const listenerType = capture ? CAPTURE : BUBBLE;
	        const newNode = {
	            listener,
	            listenerType,
	            passive: optionsIsObj && Boolean(options.passive),
	            once: optionsIsObj && Boolean(options.once),
	            next: null,
	        };

	        // Set it as the first node if the first node is null.
	        let node = listeners.get(eventName);
	        if (node === undefined) {
	            listeners.set(eventName, newNode);
	            return
	        }

	        // Traverse to the tail while checking duplication..
	        let prev = null;
	        while (node != null) {
	            if (
	                node.listener === listener &&
	                node.listenerType === listenerType
	            ) {
	                // Should ignore duplication.
	                return
	            }
	            prev = node;
	            node = node.next;
	        }

	        // Add it.
	        prev.next = newNode;
	    },

	    /**
	     * Remove a given listener from this event target.
	     * @param {string} eventName The event name to remove.
	     * @param {Function} listener The listener to remove.
	     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
	     * @returns {void}
	     */
	    removeEventListener(eventName, listener, options) {
	        if (listener == null) {
	            return
	        }

	        const listeners = getListeners(this);
	        const capture = isObject(options)
	            ? Boolean(options.capture)
	            : Boolean(options);
	        const listenerType = capture ? CAPTURE : BUBBLE;

	        let prev = null;
	        let node = listeners.get(eventName);
	        while (node != null) {
	            if (
	                node.listener === listener &&
	                node.listenerType === listenerType
	            ) {
	                if (prev !== null) {
	                    prev.next = node.next;
	                } else if (node.next !== null) {
	                    listeners.set(eventName, node.next);
	                } else {
	                    listeners.delete(eventName);
	                }
	                return
	            }

	            prev = node;
	            node = node.next;
	        }
	    },

	    /**
	     * Dispatch a given event.
	     * @param {Event|{type:string}} event The event to dispatch.
	     * @returns {boolean} `false` if canceled.
	     */
	    dispatchEvent(event) {
	        if (event == null || typeof event.type !== "string") {
	            throw new TypeError('"event.type" should be a string.')
	        }

	        // If listeners aren't registered, terminate.
	        const listeners = getListeners(this);
	        const eventName = event.type;
	        let node = listeners.get(eventName);
	        if (node == null) {
	            return true
	        }

	        // Since we cannot rewrite several properties, so wrap object.
	        const wrappedEvent = wrapEvent(this, event);

	        // This doesn't process capturing phase and bubbling phase.
	        // This isn't participating in a tree.
	        let prev = null;
	        while (node != null) {
	            // Remove this listener if it's once
	            if (node.once) {
	                if (prev !== null) {
	                    prev.next = node.next;
	                } else if (node.next !== null) {
	                    listeners.set(eventName, node.next);
	                } else {
	                    listeners.delete(eventName);
	                }
	            } else {
	                prev = node;
	            }

	            // Call this listener
	            setPassiveListener(
	                wrappedEvent,
	                node.passive ? node.listener : null
	            );
	            if (typeof node.listener === "function") {
	                try {
	                    node.listener.call(this, wrappedEvent);
	                } catch (err) {
	                    if (
	                        typeof console !== "undefined" &&
	                        typeof console.error === "function"
	                    ) {
	                        console.error(err);
	                    }
	                }
	            } else if (
	                node.listenerType !== ATTRIBUTE &&
	                typeof node.listener.handleEvent === "function"
	            ) {
	                node.listener.handleEvent(wrappedEvent);
	            }

	            // Break if `event.stopImmediatePropagation` was called.
	            if (isStopped(wrappedEvent)) {
	                break
	            }

	            node = node.next;
	        }
	        setPassiveListener(wrappedEvent, null);
	        setEventPhase(wrappedEvent, 0);
	        setCurrentTarget(wrappedEvent, null);

	        return !wrappedEvent.defaultPrevented
	    },
	};

	// `constructor` is not enumerable.
	Object.defineProperty(EventTarget.prototype, "constructor", {
	    value: EventTarget,
	    configurable: true,
	    writable: true,
	});

	// Ensure `eventTarget instanceof window.EventTarget` is `true`.
	if (
	    typeof window !== "undefined" &&
	    typeof window.EventTarget !== "undefined"
	) {
	    Object.setPrototypeOf(EventTarget.prototype, window.EventTarget.prototype);
	}

	function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
	var en = {
	  'is equal to': 'is equal to',
	  'is not equal to': 'is not equal to',
	  'contains': 'contains',
	  'does not contain': 'does not contain',
	  'starts with': 'starts with',
	  'ends with': 'ends with',
	  'is empty': 'is empty',
	  'is not empty': 'is not empty',
	  'greater than': 'greater than',
	  'greater than or equal': 'greater than or equal',
	  'less than': 'less than',
	  'less than or equal': 'less than or equal',
	  'loading': 'Loading...',
	  'error while loading options': 'Error while loading options',
	  Yes: 'Yes',
	  No: 'No'
	};
	var FieldType;

	(function (FieldType) {
	  FieldType["TEXT"] = "text";
	  FieldType["BOOLEAN"] = "boolean";
	  FieldType["NUMBER"] = "number";
	  FieldType["DATE"] = "date";
	  FieldType["TIME"] = "time";
	  FieldType["CHOICE"] = "choice";
	  FieldType["CUSTOM"] = "custom";
	  FieldType["SEPARATOR"] = "separator";
	})(FieldType || (FieldType = {}));

	var Field = function Field(props) {
	  var _props$label;

	  this.name = props.name;
	  this.label = (_props$label = props.label) != null ? _props$label : props.name;
	  this.type = props.type;
	  this.choices = props.type === FieldType.CHOICE ? props.choices : null;
	  this.value = props.type === FieldType.CUSTOM ? props.value : undefined;
	};

	var createButton = function createButton(className, label, icon) {
	  var el = document.createElement('button');
	  el.type = 'button';
	  el.classList.add(className);

	  if (icon) {
	    el.title = label;
	    var iconEl = document.createElement('i');
	    iconEl.classList.add('facets-ico-' + icon);
	    el.appendChild(iconEl);
	  } else {
	    el.innerText = label;
	  }

	  return el;
	};

	var TEXT_OPERATORS = [['eq', 'is equal to'], ['neq', 'is not equal to'], ['ct', 'contains'], ['nct', 'does not contain'], ['sw', 'starts with'], ['ew', 'ends with'], ['null', 'is empty'], ['notnull', 'is not empty']];
	var NUMBER_OPERATORS = [['eq', 'is equal to'], ['neq', 'is not equal to'], ['gt', 'greater than'], ['gte', 'greater than or equal'], ['lt', 'less than'], ['lte', 'less than or equal'], ['null', 'is empty'], ['notnull', 'is not empty']];

	var isBlink = function () {
	  var ua = navigator.userAgent;
	  return /(?:AppleWebKit|Chrome)/.test(ua);
	}();

	var Filter = /*#__PURE__*/function (_EventTarget) {
	  inheritsLoose(Filter, _EventTarget);

	  function Filter(fields, appendChild, locale, show) {
	    var _this;

	    if (locale === void 0) {
	      locale = en;
	    }

	    if (show === void 0) {
	      show = true;
	    }

	    _this = _EventTarget.call(this) || this;
	    _this.fields = fields;
	    _this.locale = locale;
	    _this._field = null;
	    _this.operatorSelect = null;
	    _this.otherInput = null;
	    var container = document.createElement('div');
	    container.classList.add('filter-container');
	    container.style.display = 'flex';
	    _this.container = appendChild(container);

	    var fieldSelect = _this.fieldSelect = _this.container.appendChild(document.createElement('select'));

	    var emptyOption = fieldSelect.appendChild(document.createElement('option'));
	    fieldSelect.value = '';

	    for (var _iterator = _createForOfIteratorHelperLoose(fields), _step; !(_step = _iterator()).done;) {
	      var field = _step.value;

	      if (field.type === FieldType.SEPARATOR) {
	        var element = void 0;

	        if (isBlink) {
	          element = document.createElement('hr');
	        } else {
	          element = document.createElement('option');
	          element.disabled = true;
	          element.value = '--------------------';
	        }

	        fieldSelect.appendChild(element);
	      } else {
	        var option = document.createElement('option');
	        option.value = field.name;
	        option.innerText = field.label;
	        fieldSelect.appendChild(option);
	      }
	    }

	    _this.specContainer = _this.container.appendChild(document.createElement('div'));
	    _this.specContainer.style.display = 'flex';
	    _this.label = _this.container.appendChild(document.createElement('span'));

	    _this.label.classList.add('filter-label');

	    _this.label.style.display = 'none';

	    var removeFilterBtn = _this.container.appendChild(createButton('remove-filter-btn', 'Remove filter', 'minus'));

	    removeFilterBtn.addEventListener('click', function () {
	      var e = new CustomEvent('remove', {
	        detail: {
	          target: assertThisInitialized(_this)
	        }
	      });

	      _this.dispatchEvent(e);
	    });

	    var applyFilterBtn = _this.container.appendChild(createButton('apply-filter-btn', 'Apply filter', 'checkmark'));

	    applyFilterBtn.style.display = 'none';
	    applyFilterBtn.addEventListener('click', function () {
	      return _this.applyFilter();
	    });
	    fieldSelect.addEventListener('change', function (e) {
	      e.stopPropagation();

	      if (null !== emptyOption) {
	        fieldSelect.removeChild(emptyOption);
	        emptyOption = null;
	      }

	      var field = fields.find(function (f) {
	        return f.name === e.target.value;
	      });

	      if (!field) {
	        e.preventDefault();
	        return;
	      }

	      applyFilterBtn.style.display = 'block';
	      _this._field = field;

	      _this._initFilter();
	    });
	    fieldSelect.focus();

	    _this.hide = function () {
	      fieldSelect.style.display = 'none';
	      _this.specContainer.style.display = 'none';
	      applyFilterBtn.style.display = 'none';
	      removeFilterBtn.style.display = 'none';
	      _this.label.style.display = 'inline-block';
	    };

	    _this.show = function () {
	      var event = new CustomEvent('open', {
	        detail: {
	          target: assertThisInitialized(_this)
	        }
	      });

	      _this.dispatchEvent(event);

	      if (event.defaultPrevented) {
	        return;
	      }

	      fieldSelect.style.display = 'block';
	      _this.specContainer.style.display = 'flex';
	      applyFilterBtn.style.display = _this._field ? 'block' : 'none';
	      removeFilterBtn.style.display = 'block';
	      _this.label.style.display = 'none';
	    };

	    _this.label.addEventListener('click', function () {
	      return _this.show();
	    });

	    if (show) {
	      setTimeout(function () {
	        return _this.show();
	      }, 0);
	    }

	    _this.container.addEventListener('keydown', function (e) {
	      if ('Enter' === e.key || 13 === e.which || 13 === e.keyCode) {
	        _this.applyFilter();

	        return false;
	      }

	      return true;
	    }, {
	      capture: true
	    });

	    return _this;
	  }

	  var _proto = Filter.prototype;

	  _proto.createTextFilter = function createTextFilter() {
	    var operatorSelect = this.operatorSelect = this.specContainer.appendChild(document.createElement('select'));

	    for (var _iterator2 = _createForOfIteratorHelperLoose(TEXT_OPERATORS), _step2; !(_step2 = _iterator2()).done;) {
	      var _this$locale$op$;

	      var op = _step2.value;
	      var option = document.createElement('option');
	      option.value = op[0];
	      option.innerText = (_this$locale$op$ = this.locale[op[1]]) != null ? _this$locale$op$ : op[1];
	      operatorSelect.appendChild(option);
	    }

	    var comparandInput = this.otherInput = this.specContainer.appendChild(document.createElement('input'));
	    comparandInput.type = 'text';
	    comparandInput.value = '';
	    operatorSelect.addEventListener('change', function (e) {
	      var operator = e.target.value;
	      comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
	    });

	    this._operator = function () {
	      var value = operatorSelect.value;
	      return TEXT_OPERATORS.find(function (o) {
	        return o[0] === value;
	      });
	    };

	    this.other = function () {
	      return comparandInput.value;
	    };
	  };

	  _proto.createNumberFilter = function createNumberFilter(type) {
	    var operatorSelect = this.operatorSelect = this.specContainer.appendChild(document.createElement('select'));

	    for (var _iterator3 = _createForOfIteratorHelperLoose(NUMBER_OPERATORS), _step3; !(_step3 = _iterator3()).done;) {
	      var _this$locale$op$2;

	      var op = _step3.value;
	      var option = document.createElement('option');
	      option.value = op[0];
	      option.innerText = (_this$locale$op$2 = this.locale[op[1]]) != null ? _this$locale$op$2 : op[1];
	      operatorSelect.appendChild(option);
	    }

	    var comparandInput = this.otherInput = this.specContainer.appendChild(document.createElement('input'));
	    comparandInput.value = '';

	    if (FieldType.NUMBER === type) {
	      comparandInput.type = 'number';
	    } else if (FieldType.DATE === type) {
	      comparandInput.type = 'date';
	    } else {
	      comparandInput.type = 'time';
	    }

	    operatorSelect.addEventListener('change', function (e) {
	      var operator = e.target.value;
	      comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
	    });

	    this._operator = function () {
	      var value = operatorSelect.value;
	      return NUMBER_OPERATORS.find(function (o) {
	        return o[0] === value;
	      });
	    };

	    this.other = function () {
	      return comparandInput.value;
	    };
	  };

	  _proto.createBooleanFilter = function createBooleanFilter() {
	    var comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
	    var values = [['1', 'Yes'], ['0', 'No']];

	    for (var _i = 0, _values = values; _i < _values.length; _i++) {
	      var _this$locale$op$3;

	      var op = _values[_i];
	      var option = document.createElement('option');
	      option.value = op[0];
	      option.innerText = (_this$locale$op$3 = this.locale[op[1]]) != null ? _this$locale$op$3 : op[1];
	      comparandSelect.appendChild(option);
	    }

	    this._operator = function () {
	      return ['eq', 'is equal to'];
	    };

	    this.other = function () {
	      return comparandSelect.value;
	    };
	  };

	  _proto.createChoiceFilter = function createChoiceFilter() {
	    var _this$_field$choices,
	        _this$_field,
	        _this2 = this;

	    var comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
	    var choices = (_this$_field$choices = (_this$_field = this._field) == null ? void 0 : _this$_field.choices) != null ? _this$_field$choices : [];

	    var loadChoices = function loadChoices(choices) {
	      comparandSelect.innerHTML = '';

	      for (var _iterator4 = _createForOfIteratorHelperLoose(choices), _step4; !(_step4 = _iterator4()).done;) {
	        var choice = _step4.value;
	        var option = document.createElement('option');
	        option.value = choice.value;
	        option.innerText = choice.label;
	        comparandSelect.appendChild(option);
	      }
	    };

	    if ('function' === typeof choices) {
	      choices = choices();
	    }

	    if ('then' in choices) {
	      var loadingOption = document.createElement('option');
	      loadingOption.value = '';
	      loadingOption.innerText = this.locale['loading'];
	      comparandSelect.appendChild(loadingOption);
	      choices.then(loadChoices, function () {
	        loadingOption.innerText = _this2.locale['error while loading options'];
	      });
	    } else {
	      loadChoices(choices);
	    }

	    this._operator = function () {
	      return ['eq', 'is equal to'];
	    };

	    this.other = function () {
	      return comparandSelect.value;
	    };
	  };

	  _proto._initFilter = function _initFilter() {
	    var field = this._field;

	    if (!field) {
	      return;
	    }

	    this.specContainer.innerHTML = '';
	    this.operatorSelect = null;
	    this.otherInput = null;

	    switch (field.type) {
	      case FieldType.TEXT:
	        this.createTextFilter();
	        break;

	      case FieldType.NUMBER:
	      case FieldType.DATE:
	      case FieldType.TIME:
	        this.createNumberFilter(field.type);
	        break;

	      case FieldType.BOOLEAN:
	        this.createBooleanFilter();
	        break;

	      case FieldType.CHOICE:
	        this.createChoiceFilter();
	        break;

	      case FieldType.CUSTOM:
	        this._operator = function () {
	          return ['', ''];
	        };

	        this.other = function () {
	          return field.value;
	        };

	        break;
	    }
	  }
	  /**
	   * @internal
	   */
	  ;

	  _proto.applyFilter = function applyFilter() {
	    var _this$_field$label;

	    if (!this._operator || !this.other || !this._field) {
	      return;
	    }

	    var operator = this._operator();

	    var other = this.other();
	    this.label.innerText = (_this$_field$label = this._field.label) != null ? _this$_field$label : this._field.name;

	    if (operator[0]) {
	      this.label.innerText += ' ' + this.locale[operator[1]];

	      if ('null' !== operator[0] && 'notnull' !== operator[0]) {
	        this.label.innerText += ' "' + other + '"';
	      }
	    }

	    this.hide();
	    this.dispatchEvent(new CustomEvent('apply-filter', {
	      detail: {
	        filter: this,
	        value: {
	          field: this._field.name,
	          operator: operator[0],
	          value: other
	        }
	      }
	    }));
	  };

	  createClass(Filter, [{
	    key: "field",
	    get: function get() {
	      return this._field ? this._field.name : '';
	    },
	    set: function set(field) {
	      var fieldObject = this.fields.find(function (f) {
	        return f.name === field;
	      });

	      if (!fieldObject) {
	        return;
	      }

	      this._field = fieldObject;
	      this.fieldSelect.value = fieldObject.name;

	      this._initFilter();
	    }
	  }, {
	    key: "operator",
	    get: function get() {
	      return this._operator ? this._operator() : ['eq', this.locale['is equal to']];
	    },
	    set: function set(op) {
	      if (this.operatorSelect) {
	        this.operatorSelect.value = op[0];
	      }

	      this._operator = function () {
	        return op;
	      };
	    }
	  }, {
	    key: "value",
	    get: function get() {
	      return this.other ? this.other() : null;
	    },
	    set: function set(value) {
	      if (this.otherInput) {
	        this.otherInput.value = value;
	      }

	      this.other = function () {
	        return value;
	      };
	    }
	  }]);

	  return Filter;
	}(EventTarget);

	var DEFAULT_OPTIONS = {
	  classPrefix: '',
	  locale: en,
	  dropdownLoader: /*#__PURE__*/regenerator.mark(function dropdownLoader(value, instance) {
	    var textFields, _iterator5, _step5, field;

	    return regenerator.wrap(function dropdownLoader$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            textFields = instance.fields.filter(function (f) {
	              return f.type === FieldType.TEXT;
	            });
	            _iterator5 = _createForOfIteratorHelperLoose(textFields);

	          case 2:
	            if ((_step5 = _iterator5()).done) {
	              _context.next = 8;
	              break;
	            }

	            field = _step5.value;
	            _context.next = 6;
	            return {
	              label: field.label + ' ' + instance.locale['contains'] + ' "' + value + '"',
	              filter: {
	                field: field.name,
	                operator: ['ct', instance.locale['contains']],
	                value: value
	              }
	            };

	          case 6:
	            _context.next = 2;
	            break;

	          case 8:
	          case "end":
	            return _context.stop();
	        }
	      }
	    }, dropdownLoader);
	  })
	};

	function isKeyboardEvent(e) {
	  return 'key' in e || 'which' in e || 'keyCode' in e;
	}

	var Facets = /*#__PURE__*/function (_EventTarget2) {
	  inheritsLoose(Facets, _EventTarget2);

	  function Facets(element, options) {
	    var _this3;

	    if (options === void 0) {
	      options = {};
	    }

	    _this3 = _EventTarget2.call(this) || this;
	    _this3.element = element;
	    _this3.fields = [];
	    _this3.filters = [];
	    _this3._appliedFilters = new Set();
	    _this3.dropdownSelected = -1;

	    if ('DIV' !== element.tagName) {
	      throw new TypeError('Facets.js only supports div tags');
	    }

	    if (!options.fields || !Array.isArray(options.fields) || 0 === options.fields.length) {
	      throw new Error('At least one field is required');
	    }

	    _this3.options = Object.assign({}, options, DEFAULT_OPTIONS);

	    if (_this3.options.classPrefix) {
	      _this3.options.classPrefix += '-';
	    }

	    _this3.locale = _this3.options.locale;
	    _this3.fields = Object.freeze(options.fields.map(function (f) {
	      return new Field(f);
	    }));
	    _this3.element.innerHTML = '';

	    _this3.element.classList.add(_this3.options.classPrefix + 'facets-js-wrapper');

	    _this3.element.style.display = 'flex';
	    _this3.element.style.flexWrap = '1'; // @todo: add default filters

	    var newFilterBtn = createButton('new-filter-btn', 'Add filter', 'plus');
	    _this3.newFilterBtn = _this3.element.appendChild(newFilterBtn);

	    _this3.newFilterBtn.addEventListener('click', function () {
	      return _this3.createFilter();
	    });

	    var inputBox = document.createElement('input');
	    inputBox.type = 'text';
	    inputBox.style.minWidth = '10rem';
	    inputBox.style.flexGrow = '1';
	    inputBox.style.border = '0';
	    _this3.inputBox = _this3.element.appendChild(inputBox);

	    _this3.inputBox.addEventListener('input', _this3.onInput.bind(assertThisInitialized(_this3)));

	    _this3.inputBox.addEventListener('keydown', _this3.onInput.bind(assertThisInitialized(_this3)));

	    _this3.inputBox.addEventListener('keypress', _this3.onInput.bind(assertThisInitialized(_this3)));

	    _this3.inputBox.addEventListener('click', _this3.onInput.bind(assertThisInitialized(_this3)));

	    _this3.dropdown = document.body.appendChild(document.createElement('div'));

	    _this3.dropdown.classList.add('facets-js-dropdown', 'facets-js-hide');

	    return _this3;
	  }

	  var _proto2 = Facets.prototype;

	  _proto2.destroy = function destroy() {
	    document.body.removeChild(this.dropdown);
	  };

	  _proto2.onInput = function onInput(e) {
	    var _this4 = this;

	    var value = e.target.value;

	    if (!value) {
	      this.dropdown.classList.add('facets-js-hide');
	      return;
	    }

	    var rect = this.inputBox.getBoundingClientRect();
	    var choices = [];

	    for (var _iterator6 = _createForOfIteratorHelperLoose(this.options.dropdownLoader(value, this)), _step6; !(_step6 = _iterator6()).done;) {
	      var choice = _step6.value;
	      choices.push(choice);
	    }

	    var applyFilter = function applyFilter(choice) {
	      var choiceFilter = choice.filter;

	      var filter = _this4.createFilter(false);

	      filter.field = choiceFilter.field;
	      filter.operator = choiceFilter.operator;
	      filter.value = choiceFilter.value;

	      _this4.filters.push(filter);

	      filter.applyFilter();

	      _this4.dropdown.classList.add('facets-js-hide');

	      _this4.inputBox.value = '';
	    };

	    if (isKeyboardEvent(e)) {
	      if ('Enter' === e.key || 13 === e.which || 13 === e.keyCode) {
	        if (-1 !== this.dropdownSelected) {
	          applyFilter(choices[this.dropdownSelected]);
	        } else if ('' !== this.inputBox.value) {
	          this.dropdown.classList.remove('facets-js-hide');
	        }

	        return;
	      } else if ('ArrowUp' === e.key || 38 === e.which || 38 === e.keyCode) {
	        if (-1 === this.dropdownSelected || 0 === this.dropdownSelected) {
	          this.dropdownSelected = this.dropdown.children.length - 1;
	        } else {
	          this.dropdownSelected--;
	        }

	        Array.prototype.slice.call(this.dropdown.children).forEach(function (e) {
	          return e.classList.remove('selected');
	        });
	        this.dropdown.children[this.dropdownSelected].classList.add('selected');
	        return;
	      } else if ('ArrowDown' === e.key || 40 === e.which || 40 === e.keyCode) {
	        if (-1 === this.dropdownSelected || this.dropdown.children.length - 1 === this.dropdownSelected) {
	          this.dropdownSelected = 0;
	        } else {
	          this.dropdownSelected++;
	        }

	        Array.prototype.slice.call(this.dropdown.children).forEach(function (e) {
	          return e.classList.remove('selected');
	        });
	        this.dropdown.children[this.dropdownSelected].classList.add('selected');
	        return;
	      } else if ('Escape' === e.key || 27 === e.which || 27 === e.keyCode) {
	        this.dropdownSelected = -1;
	        this.dropdown.classList.add('facets-js-hide');
	        return;
	      }
	    }

	    this.dropdown.innerHTML = '';
	    this.dropdown.classList.remove('facets-js-hide');
	    this.dropdown.style.width = rect.width.toString() + 'px';
	    this.dropdown.style.overflowY = 'scroll';
	    this.dropdown.style.top = (rect.bottom + 5).toString() + 'px';
	    this.dropdown.style.left = rect.left.toString() + 'px';

	    var listener = function listener(e) {
	      var el = e.target;

	      do {
	        if (el === _this4.inputBox || el === _this4.dropdown) {
	          return;
	        }

	        el = el.parentElement || el.parentNode;
	      } while (null !== el && 1 === el.nodeType);

	      _this4.dropdownSelected = -1;
	      document.removeEventListener('click', listener);

	      _this4.dropdown.classList.add('facets-js-hide');
	    };

	    var index = -1;
	    var height = 0;
	    document.addEventListener('click', listener, {
	      capture: true
	    });

	    var _loop = function _loop() {
	      var choice = _choices[_i2];
	      var currentIndex = ++index;

	      var choiceElement = _this4.dropdown.appendChild(document.createElement('div'));

	      choiceElement.classList.add('facets-js-combo-choice');
	      choiceElement.innerText = choice.label;

	      var hover = function hover() {
	        Array.prototype.slice.call(_this4.dropdown.children).forEach(function (e) {
	          return e.classList.remove('selected');
	        });
	        _this4.dropdownSelected = currentIndex;
	        choiceElement.classList.add('selected');
	      };

	      choiceElement.addEventListener('mouseover', hover);
	      choiceElement.addEventListener('mouseenter', hover);
	      choiceElement.addEventListener('mouseout', function () {
	        if (_this4.dropdownSelected === currentIndex) {
	          _this4.dropdownSelected = -1;
	        }

	        choiceElement.classList.remove('selected');
	      });
	      choiceElement.addEventListener('click', applyFilter.bind(_this4, choice));
	      var rect = choiceElement.getBoundingClientRect();
	      height += rect.height;
	    };

	    for (var _i2 = 0, _choices = choices; _i2 < _choices.length; _i2++) {
	      _loop();
	    }

	    this.dropdown.style.height = height.toString() + 'px';
	  };

	  _proto2.createFilter = function createFilter(show) {
	    var _this5 = this;

	    if (show === void 0) {
	      show = true;
	    }

	    var filter = new Filter(this.fields, function (element) {
	      return _this5.element.insertBefore(element, _this5.newFilterBtn);
	    }, this.locale, show);
	    this.filters.push(filter);
	    this.newFilterBtn.style.display = 'none';
	    filter.addEventListener('remove', function () {
	      _this5.element.removeChild(filter.container);

	      _this5.filters.splice(_this5.filters.indexOf(filter), 1);

	      _this5.newFilterBtn.style.display = 'block';

	      _this5._appliedFilters.delete(filter);
	    }, {
	      once: true
	    });
	    filter.addEventListener('open', function () {
	      _this5.newFilterBtn.style.display = 'none';
	    });
	    filter.addEventListener('apply-filter', function (e) {
	      _this5.newFilterBtn.style.display = 'block';
	      var filter = e.detail.filter;

	      _this5._appliedFilters.add(filter);

	      _this5.dispatchEvent(new CustomEvent('change', {
	        detail: _this5.appliedFilters
	      }));
	    });
	    return filter;
	  };

	  createClass(Facets, [{
	    key: "appliedFilters",
	    get: function get() {
	      return [].concat(this._appliedFilters.values());
	    }
	  }]);

	  return Facets;
	}(EventTarget);

	var example1 = new Facets(document.getElementById('facets-example-1'), {
	    fields: [
	        { name: 'name', label: 'Nome', type: FieldType.TEXT },
	        { name: 'age', label: 'Età', type: FieldType.NUMBER },
	        { name: 'Foo', label: 'foo', type: FieldType.BOOLEAN },
	        { name: 'sep1', type: FieldType.SEPARATOR },
	        { name: 'date', label: 'Data', type: FieldType.DATE },
	        { name: 'time', label: 'Ora', type: FieldType.TIME },
	        { name: 'select', label: 'Scelta', type: FieldType.CHOICE, choices: [
	                { label: 'Good!', value: 'good' },
	                { label: 'Bad!', value: 'bad' },
	            ] },
	        { name: 'custom', label: 'My filter', type: FieldType.CUSTOM, value: [
	                {
	                    field: 'name',
	                    operator: ['eq', 'is equal to'],
	                    value: 'Foobar',
	                },
	            ] },
	    ],
	});
	console.log(example1);

}());
//# sourceMappingURL=example.bundle.js.map
